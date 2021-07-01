import { createAutocomplete } from "@algolia/autocomplete-core";
import "@algolia/autocomplete-theme-classic";
import React from "react";
// import { appendHighlightTags, toKebabCase } from "../utils/utils";
import { Form } from "react-bootstrap";
// import { Link } from "react-router-dom";
import { ClearIcon } from "../components/ClearIcon";
import { SearchIcon } from "../components/SearchIcon";
import {
  getSuggestions,
  querySuggestionsPlugin,
  recentSearchesPlugin,
  sourceIndexName,
} from "../lib/Algolia";

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
      autocompleteState: {},
      query: "",
      hits: [],
      recentSearches: [],
      topSearches: [],
      selectedGender: "women",
      value: "",
    };

    this.autocomplete = createAutocomplete({
      onStateChange: this.onChange,
      plugins: [querySuggestionsPlugin(), recentSearchesPlugin()],
      ...this.props,
    });

    this.inputRef = React.createRef(null);
    this.formRef = React.createRef(null);
    this.panelRef = React.createRef(null);
  }

  onChange = async ({ state }) => {
    const defaultHit = {
      query: state.query,
      count: "-",
    };
    this.setState({ autocompleteState: state, query: state.query });
    const { autocompleteState, selectedGender } = this.state;
    const hits = await getSuggestions(
      selectedGender === "all"
        ? state.query
        : `${genders[this.state.selectedGender].value} ${state.query}`
    );
    const newHits = hits.length ? this.createSuggestions(hits) : [defaultHit];

    this.setState(
      {
        // value,
        hits: newHits || [],
        // loading: false
      },
      () => console.log(this.state.hits)
    );
  };

  onGenderSelect = (value) => {
    this.setState({ selectedGender: value });
  };

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
      subCategory.forEach((ele) => {
        if (
          this.checkForValidSuggestion(ele.value.replaceAll("/// ", ""), [
            ...resArray,
            ...arr,
          ])
        ) {
          let val = ele.value.split(" /// ").reverse();
          arr.push({
            query: val.join(" "),
            filter: [
              {
                type: "category_level2",
                value: ele.value,
              },
            ],
            count: ele.count,
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

  fomatQuery = (query) => {
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

  componentDidMount() {
    const { getEnvironmentProps } = this.autocomplete;
    if (
      !this.formRef.current ||
      !this.panelRef.current ||
      !this.inputRef.current
    ) {
      return undefined;
    }
    const { onTouchStart, onTouchMove } = getEnvironmentProps({
      formElement: this.formRef.current,
      inputElement: this.inputRef.current,
      panelElement: this.panelRef.current,
    });

    window.addEventListener("touchstart", onTouchStart);
    window.addEventListener("touchmove", onTouchMove);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }
  render() {
    const { autocompleteState, selectedGender, hits } = this.state;
    console.log("autocompleteState", autocompleteState);
    return (
      <div className="aa-Autocomplete" {...this.autocomplete.getRootProps({})}>
        {Object.values(genders).map(({ label, value }) => (
          <Form.Check
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
        <form
          ref={this.formRef}
          className="aa-Form"
          {...this.autocomplete.getFormProps({
            inputElement: this.inputRef.current,
          })}
        >
          <div className="aa-InputWrapperPrefix">
            <label
              className="aa-Label"
              {...this.autocomplete.getLabelProps({})}
            >
              <button className="aa-SubmitButton" type="submit" title="Submit">
                <SearchIcon />
              </button>
            </label>
          </div>
          <div className="aa-InputWrapper">
            <input
              className="aa-Input"
              ref={this.inputRef}
              {...this.autocomplete.getInputProps({
                inputElement: this.inputRef.current,
              })}
            />
          </div>
          <div className="aa-InputWrapperSuffix">
            <button className="aa-ClearButton" title="Clear" type="reset">
              <ClearIcon />
            </button>
          </div>
        </form>
        {hits.slice(0, 5).map((ele) => {
          return <p>{this.fomatQuery(ele.query)}</p>;
        })}
      </div>
    );
  }
}
