import React from "react";
import { Form, FormControl, InputGroup } from "react-bootstrap";
import { SearchIcon } from "../components/SearchIcon";
import {
  getRecentSearches,
  getSuggestions,
  getTopSearches,
  setRecentSearches,
  sourceIndexName,
} from "../lib/Algolia";
import { toKebabCase } from "../utils/utils";

const genders = {
  all: {
    label: "All",
    value: "all",
  },
  women: {
    label: "Women",
    value: "women",
  },
  men: {
    label: "Men",
    value: "men",
  },
  kids: {
    label: "Kids",
    value: "kids",
  },
};

export default class Home extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      query: "",
      hits: [],
      recentSearches: [], // todo
      topSearches: [], // todo
      selectedGender: "women",
      showSuggestion: false,
    };
    this.inputRef = React.createRef();
  }

  // utils

  createSuggestions = (hits) => {
    let arr = [];
    let i = 0;
    while (arr.length < 5 && i < hits.length) {
      arr.push(...this.getHits(hits[i], arr));
      i++;
    }
    return arr;
  };

  getHits = (hit, resArray) => {
    let arr = [];
    let {
      all,
      [this.state.selectedGender]: selectedGender,
      ...filter
    } = genders;
    const {
      query,
      [sourceIndexName]: {
        exact_nb_hits,
        facets: {
          exact_matches: {
            brand_name,
            "categories.level1": categories_level1,
            "categories.level2": categories_level2,
            "categories.level3": categories_level3,
          },
        },
      },
    } = hit;
    let category;
    let subCategory;
    if (
      query.toUpperCase().includes("KIDS") ||
      query.toUpperCase().includes("GIRL") ||
      query.toUpperCase().includes("GIRLS") ||
      query.toUpperCase().includes("BOY") ||
      query.toUpperCase().includes("BOYS") ||
      query.toUpperCase().includes("BABY GIRL") ||
      query.toUpperCase().includes("BABY BOY")
    ) {
      category = categories_level2;
      subCategory = categories_level3;
    } else {
      category = categories_level1;
      subCategory = categories_level2;
    }
    if (hit.query.toUpperCase().includes(brand_name[0].value.toUpperCase())) {
      if (this.checkForValidSuggestion(query, [...resArray, ...arr])) {
        arr.push({
          query,
          filter: [
            {
              type: "brand",
              value: brand_name[0].value,
            },
          ],
          count: brand_name[0].count,
        });
      }
      category.forEach((ele) => {
        if (
          this.checkForValidSuggestion(
            brand_name[0].value + " " + ele.value.replaceAll("/// ", ""),
            [...resArray, ...arr]
          )
        ) {
          arr.push({
            query: brand_name[0].value + " " + ele.value.replaceAll("/// ", ""),
            filter: [
              {
                type: "brand",
                value: brand_name[0].value,
              },
              {
                type: "category_level1",
                value: ele.value,
              },
            ],
            count: ele.count,
          });
        }
      });
      subCategory.forEach((ele) => {
        if (
          this.checkForValidSuggestion(
            brand_name[0].value + " " + ele.value.replaceAll("/// ", ""),
            [...resArray, ...arr]
          )
        ) {
          let val = ele.value.split(" /// ").reverse();
          arr.push({
            query: brand_name[0].value + " " + val.join(" "),
            filter: [
              {
                type: "brand",
                value: brand_name[0].value,
              },
              {
                type: "category_level2",
                value: ele.value,
              },
            ],
            count: ele.count,
          });
        }
      });
    } else {
      category.forEach((ele) => {
        if (
          this.checkForValidSuggestion(ele.value.replaceAll("/// ", ""), [
            ...resArray,
            ...arr,
          ])
        ) {
          arr.push({
            query: ele.value.replaceAll("/// ", ""),
            filter: [
              {
                type: "category_level1",
                value: ele.value,
              },
            ],
            count: ele.count,
          });
        }
      });
      subCategory.forEach((item) => {
        if (
          this.checkForValidSuggestion(item.value.replaceAll("/// ", ""), [
            ...resArray,
            ...arr,
          ])
        ) {
          let val = item.value.split(" /// ").reverse();
          arr.push({
            query: val.join(" "),
            filter: [
              {
                type: "category_level2",
                value: item.value,
              },
            ],
            count: item.count,
          });
        }
      });
      if (
        this.checkForValidSuggestion(brand_name[0].value + " " + query, [
          ...resArray,
          ...arr,
        ])
      ) {
        arr.push({
          query: brand_name[0].value + " " + query,
          filter: [
            {
              type: "brand",
              value: brand_name[0].value,
            },
          ],
          count: brand_name[0].count,
        });
      }
    }
    if (this.checkForValidSuggestion(query, [...resArray, ...arr])) {
      arr.unshift({
        query,
        count: exact_nb_hits,
      });
    }
    return arr;
  };

  checkForValidSuggestion = (value, arr) => {
    let valid = true;

    if (/\b(?:OUTLET|INFLUENCER|INFLUENCERS)\b/i.test(value)) return false;

    if (
      value.toUpperCase() === this.state.selectedGender.toUpperCase() ||
      value.toUpperCase() === "KIDS BABY GIRL" ||
      value.toUpperCase() === "KIDS GIRL" ||
      value.toUpperCase() === "KIDS BOY" ||
      value.toUpperCase() === "KIDS BABY BOY"
    )
      return false;

    if (this.state.selectedGender !== "all") {
      let {
        all,
        [this.state.selectedGender]: selectedGender,
        ...filters
      } = genders;
      Object.keys(filters).forEach((filter) => {
        let regex = new RegExp("\\b" + filter + "\\b", "i");
        if (regex.test(value)) {
          valid = false;
        }
      });
    }
    let hit = arr.find(
      (ele) =>
        ele.query
          .replace(/[&-]/g, "")
          .replace(/^\s+|\s+$/g, "")
          .replace(/\s+/g, " ")
          .toUpperCase()
          .split(" ")
          .sort()
          .join(" ") ===
        value
          .replace(/[&-]/g, "")
          .replace(/^\s+|\s+$/g, "")
          .replace(/\s+/g, " ")
          .toUpperCase()
          .split(" ")
          .sort()
          .join(" ")
    );
    // console.log(hit, arr, value);
    if (hit) valid = false;
    return valid;
  };

  formatQuery = (query) => {
    let avoidFilter = this.state.selectedGender;
    if (
      query.toUpperCase().includes("GIRL") ||
      query.toUpperCase().includes("BOY") ||
      query.toUpperCase().includes("GIRLS") ||
      query.toUpperCase().includes("BOYS") ||
      query.toUpperCase().includes("BABY BOY") ||
      query.toUpperCase().includes("BABY GIRL")
    )
      avoidFilter = "kids";
    else if (this.state.selectedGender === "all") return query;

    let regex = new RegExp("\\b" + avoidFilter + "\\b", "i");
    return query
      .replace(regex, "")
      .replace(/^\s+|\s+$/g, "")
      .replace(/\s+/g, " ");
  };

  getHighlightedText(text, highlight) {
    // Split on highlight term and include term into parts, ignore case
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <span>
        {" "}
        {parts.map((part, i) => (
          <span
            key={i}
            style={
              part.toLowerCase() === highlight.toLowerCase()
                ? { fontWeight: "bold" }
                : {}
            }
          >
            {part}
          </span>
        ))}{" "}
      </span>
    );
  }

  fetchTopSearches = async () => {
    const topSearches = await getTopSearches();
    this.setState({
      topSearches: topSearches?.filter((ele) => ele !== "") || [],
    });
  };

  fetchRecentSearches = async () => {
    const recentSearches = await getRecentSearches("users1");
    this.setState({
      recentSearches: recentSearches || [],
    });
  };

  // functions

  onTextChange = async () => {
    console.log("query", this.inputRef.current.value);
    const { selectedGender } = this.state;
    const defaultHit = {
      query: this.inputRef.current.value,
      count: "-",
    };

    const hits = await getSuggestions(
      selectedGender === "all"
        ? this.inputRef.current.value
        : `${genders[this.state.selectedGender].value} ${
            this.inputRef.current.value
          }`
    );
    const newHits = hits?.length ? this.createSuggestions(hits) : [defaultHit];

    this.setState(
      {
        query: this.inputRef.current.value,
        hits: newHits || [],
        // loading: false
      }
      // () => console.log(this.state.hits)
    );
  };

  onGenderSelect = (value) => {
    this.setState({ selectedGender: value });
  };

  onSuggestionClick = ({ query, filter, ...rest }) => {
    let params = {
      q: query,
    };
    if (filter) {
      filter.forEach(({ type, value }) => {
        if (type === "brand") {
          params = { ...params, brand_name: value };
        } else if (type === "category_level1") {
          params = { ...params, "categories.level1": value };
        } else if (type === "category_level2") {
          params = { ...params, "categories.level2": value };
        }
      });
    }
    if (this.state.selectedGender !== "all") {
      params = { ...params, "categories.level0": this.state.selectedGender };
    }
    console.log(toKebabCase(this.formatQuery(query)));
    console.log("params", params);
    // this.props.navigation.navigate("PLP", {
    //   params,
    //   title: query,
    // });
    console.log("plp query stirng", { params, title: query });
    this.props.history.push({
      pathname: `/plp/?q=${JSON.stringify({ params, title: query })}`,
    });
  };

  onSearchSubmit = async (query) => {
    const recentSearches = await setRecentSearches(query, "users1");
    this.setState({
      recentSearches,
    });
  };

  componentDidMount() {
    this.fetchTopSearches();
    // this.fetchRecentSearches();
    console.log("this.state.topSearches", this.state.topSearches);
    console.log("this.state.recentSearches", this.state.recentSearches);
  }

  render() {
    const { selectedGender, hits, showSuggestion, query, topSearches } =
      this.state;
    return (
      <div className="">
        {Object.values(genders).map(({ label, value }) => (
          <Form.Check
            key={Math.random()}
            checked={selectedGender === value}
            inline
            label={label}
            value={value}
            type="radio"
            id={Math.random()}
            onChange={() => this.onGenderSelect(value)}
          />
        ))}
        {/* render field */}
        <Form
          className="d-flex w-100"
          onSubmit={() => this.onSearchSubmit(this.inputRef.value)}
        >
          <InputGroup className="mb-3">
            <FormControl
              style={{ height: "44px" }}
              placeholder="Search"
              aria-label="Search"
              aria-describedby="searchbox"
              ref={this.inputRef}
              className=""
              onChange={() => this.onTextChange()}
              onFocus={() => this.setState({ showSuggestion: true })}
              // onBlur={() => this.setState({ showSuggestion: false })}
            />
            <InputGroup.Append>
              <InputGroup.Text id="searchbox">
                <button
                  className="aa-SubmitButton"
                  type="submit"
                  title="Submit"
                >
                  <SearchIcon />
                </button>
              </InputGroup.Text>
            </InputGroup.Append>
          </InputGroup>
        </Form>
        {showSuggestion && (
          <div>
            <div className="">
              {topSearches.length > 0 ? (
                <section className="top searches">
                  <div>
                    <div>Top Searches</div>
                    <ul className="d-flex">
                      {this.state.topSearches.map((ele) => {
                        return (
                          <li key={Math.random()} className="aa-Item">
                            <div
                              className="px-3 cursor-pointer"
                              onClick={() => this.onSuggestionClick(ele)}
                            >
                              {ele.search ? ele.search : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </section>
              ) : null}
              {hits.length > 0 ? (
                <section className="">
                  <div>Search Suggestions</div>
                  <div>
                    <ul className="">
                      {hits.slice(0, 5).map((ele) => {
                        return (
                          <li key={Math.random()} className="aa-Item">
                            <div
                              className="cursor-pointer"
                              onClick={() => this.onSuggestionClick(ele)}
                            >
                              {this.getHighlightedText(
                                this.formatQuery(ele.query),
                                query
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  }
}
