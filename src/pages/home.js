import React from "react";
import { Form, FormControl, InputGroup } from "react-bootstrap";
import { SearchIcon } from "../components/SearchIcon";
import {
  algoliaSDK,
  getRecentSearches,
  getSuggestions,
  getTopSearches,
  setRecentSearches,
  sourceIndexName,
} from "../lib/Algolia";
import { capitalizeFirstLetters } from "../utils/utils";

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

  fetchTopSearches = async () => {
    const topSearches = await getTopSearches();
    this.setState({
      topSearches: topSearches?.filter((ele) => ele.search !== "") || [],
    });
  };

  fetchRecentSearches = async () => {
    const recentSearches = await getRecentSearches("users1");
    this.setState({
      recentSearches: recentSearches || [],
    });
  };

  getCustomQuerySuggestions = (hits, indexName) => {
    let arr = [];
    let i = 0;
    while (arr.length < 5 && i < hits.length) {
      arr.push(...this.createCustomQuerySuggestions(hits[i], arr, indexName));
      i++;
    }
    console.log("final array", arr);
    return arr;
  };

  addSuggestion = (label, query, filter, count, arr, operation = "push") => {
    if (operation === "push") {
      arr.push({
        label,
        query,
        filter,
        count,
      });
    } else if (operation === "unshift") {
      arr.unshift({
        label,
        query,
        filter,
        count,
      });
    }
  };

  checkForQueryWithGender = (query) => {
    const { selectedGender } = this.state;
    if (selectedGender === "all") return true;
    let regexStr;
    switch (selectedGender) {
      case "women":
        regexStr = "women";
        break;

      case "men":
        regexStr = "men";
        break;

      case "kids":
        regexStr = "KIDS|GIRL|BOY|BABY BOY|BABY GIRL";
        break;
      default:
        break;
    }
    let regex = new RegExp(`\\b${regexStr}\\b`, "i");
    return regex.test(query);
  };

  createCustomQuerySuggestions = (hit, resArray, indexName) => {
    let arr = [];
    let {
      all,
      [this.state.selectedGender]: selectedGender,
      ...filter
    } = genders;

    // actual code
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
    console.log("single hit", hit);
    let genderModifiedQuery;

    if (this.checkForQueryWithGender(query)) {
      genderModifiedQuery = query;
    } else {
      const { selectedGender } = this.state;
      genderModifiedQuery = `${selectedGender} ${query}`;
    }

    // if query does include brands
    if (query.toUpperCase().includes(brand_name[0].value.toUpperCase())) {
      if (
        this.checkForValidSuggestion(genderModifiedQuery, [...resArray, ...arr])
      ) {
        this.addSuggestion(
          genderModifiedQuery,
          genderModifiedQuery,
          [
            {
              type: "brand",
              value: brand_name[0].value,
            },
          ],
          brand_name[0].count,
          arr
        );
      }
      categories_level1.forEach((ele) => {
        const suggestionLabel = `${brand_name[0].value} ${ele.value.replaceAll(
          "/// ",
          ""
        )}`;

        if (
          this.checkForValidSuggestion(suggestionLabel, [...resArray, ...arr])
        ) {
          this.addSuggestion(
            suggestionLabel,
            suggestionLabel,
            [
              {
                type: "brand",
                value: brand_name[0].value,
              },
              {
                type: "categories_level1",
                value: ele.value,
              },
            ],
            ele.count,
            arr
          );
        }
      });

      categories_level2.forEach((ele) => {
        const val = ele.value.split(" /// ");
        const testQuery = `${brand_name[0].value} ${[
          ...val.slice(0, val.length - 2),
          ...val.slice(val.length - 1),
        ].join(" ")}`;

        if (this.checkForValidSuggestion(testQuery, [...resArray, ...arr])) {
          this.addSuggestion(
            testQuery,
            testQuery,
            [
              {
                type: "brand",
                value: brand_name[0].value,
              },
              {
                type: "categories_level2",
                value: ele.value,
              },
            ],
            ele.count,
            arr
          );
        }
      });

      categories_level3.forEach((ele) => {
        const val = ele.value.split(" /// ");
        const formattedQuery = ele.value.replaceAll("/// ", "");
        const testQuery = `${brand_name[0].value} ${[
          ...val.slice(
            0,
            this.checkForKidsFilterQuery(formattedQuery) ? val.length - 2 : 1
          ),
          ...val.slice(val.length - 1),
        ].join(" ")}`;
        if (this.checkForValidSuggestion(testQuery, [...resArray, ...arr])) {
          this.addSuggestion(
            testQuery,
            testQuery,
            [
              {
                type: "categories_level3",
                value: ele.value,
              },
            ],
            ele.count,
            arr
          );
        }
      });
    }
    // if query does not include brands
    else {
      categories_level1.forEach((ele) => {
        const suggestionLabel = ele.value.replaceAll("/// ", "");

        if (
          this.checkForValidSuggestion(suggestionLabel, [...resArray, ...arr])
        ) {
          this.addSuggestion(
            suggestionLabel,
            suggestionLabel,
            [
              {
                type: "categories_level1",
                value: ele.value,
              },
            ],
            ele.count,
            arr
          );
        }
      });

      categories_level2.forEach((ele) => {
        const val = ele.value.split(" /// ");
        const testQuery = `${[
          ...val.slice(0, val.length - 2),
          ...val.slice(val.length - 1),
        ].join(" ")}`;

        if (this.checkForValidSuggestion(testQuery, [...resArray, ...arr])) {
          this.addSuggestion(
            testQuery,
            testQuery,
            [
              {
                type: "categories_level2",
                value: ele.value,
              },
            ],
            ele.count,
            arr
          );
        }
      });

      categories_level3.forEach((ele) => {
        const val = ele.value.split(" /// ");
        const formattedQuery = ele.value.replaceAll("/// ", "");
        const testQuery = `${[
          ...val.slice(
            0,
            this.checkForKidsFilterQuery(formattedQuery) ? val.length - 2 : 1
          ),
          ...val.slice(val.length - 1),
        ].join(" ")}`;
        if (this.checkForValidSuggestion(testQuery, [...resArray, ...arr])) {
          this.addSuggestion(
            testQuery,
            testQuery,
            [
              {
                type: "categories_level3",
                value: ele.value,
              },
            ],
            ele.count,
            arr
          );
        }
      });
      if (
        this.checkForValidSuggestion(
          `${brand_name[0].value} ${genderModifiedQuery}`,
          [...resArray, ...arr]
        )
      ) {
        this.addSuggestion(
          `${brand_name[0].value} ${genderModifiedQuery}`,
          `${brand_name[0].value} ${genderModifiedQuery}`,
          [
            {
              type: "brand",
              value: brand_name[0].value,
            },
          ],
          brand_name[0].count,
          arr
        );
      }
    }
    if (
      this.checkForValidSuggestion(`${genderModifiedQuery}`, [
        ...resArray,
        ...arr,
      ])
    ) {
      this.addSuggestion(
        `${genderModifiedQuery}`,
        `${genderModifiedQuery}`,
        undefined,
        exact_nb_hits,
        arr,
        "unshift"
      );
    }
    return arr;
  };

  checkForValidSuggestion = (value, arr) => {
    let valid = true;

    if (
      /\b(?:OUTLET|INFLUENCER|INFLUENCERS|NEW IN|BLACK FRIDAY)\b/i.test(value)
    )
      return false;

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
    if (hit) valid = false;
    return valid;
  };

  formatQuery = (query) => {
    const capitalizedQuery = capitalizeFirstLetters(query);
    let avoidFilter = this.state.selectedGender;
    if (this.checkForKidsFilterQuery(capitalizedQuery)) avoidFilter = "kids";
    else if (this.state.selectedGender === "all") return query;

    let regex = new RegExp("\\b" + avoidFilter + "\\b", "i");
    return query
      .replace(regex, "")
      .replace(/^\s+|\s+$/g, "")
      .replace(/\s+/g, " ");
  };

  checkForKidsFilterQuery(query) {
    return (
      query.toUpperCase().includes("KIDS") ||
      query.toUpperCase().includes("GIRL") ||
      query.toUpperCase().includes("GIRLS") ||
      query.toUpperCase().includes("BOY") ||
      query.toUpperCase().includes("BOYS") ||
      query.toUpperCase().includes("BABY GIRL") ||
      query.toUpperCase().includes("BABY BOY")
    );
  }
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

  // functions

  onTextChange = async () => {
    const defaultHit = {
      query: this.inputRef.current.value,
      count: "-",
    };
    const searchQuery = this.inputRef.current.value;
    const hits = await getSuggestions(searchQuery);
    const { indexName } = await algoliaSDK.getIndex();
    const querySuggestions = hits?.length
      ? this.getCustomQuerySuggestions(hits, indexName)
      : [defaultHit];
    this.setState(
      {
        query: this.inputRef.current.value,
        hits: querySuggestions || [],
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
    // this.props.navigation.navigate("PLP", {
    //   params,
    //   title: query,
    // });
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

  async componentDidMount() {
    await this.fetchRecentSearches();
    await this.fetchTopSearches();
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
          // onSubmit={() => this.onSearchSubmit(this.inputRef.value)}
        >
          <InputGroup className="mb-3">
            <FormControl
              style={{ height: "44px" }}
              placeholder="Search"
              aria-label="Search"
              aria-describedby="searchbox"
              ref={this.inputRef}
              className=""
              onChange={this.onTextChange}
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
              {topSearches.length > 0 && !query ? (
                <section className="top searches">
                  <div>
                    <div>Top Searches</div>
                    <ul className="d-flex">
                      {this.state.topSearches.map((ele) => {
                        return (
                          <li key={Math.random()} className="aa-Item">
                            <div
                              className="px-3 cursor-pointer"
                              // onClick={() => this.onSuggestionClick(ele)}
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
              {hits.length > 0 && query ? (
                <section className="">
                  <div>Search Suggestions</div>
                  <div>
                    <ul className="">
                      {hits.slice(0, 5).map((ele) => {
                        return (
                          <li key={Math.random()} className="aa-Item">
                            <div
                              className="cursor-pointer"
                              // onClick={() => this.onSuggestionClick(ele)}
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
