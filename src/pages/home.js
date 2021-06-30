// import { createAutocomplete } from "@algolia/autocomplete-core";
import { createAutocomplete } from "@algolia/autocomplete-core";
import "@algolia/autocomplete-theme-classic";
import React from "react";
import { ClearIcon } from "../components/ClearIcon";
import { SearchIcon } from "../components/SearchIcon";
import { querySuggestionsPlugin, recentSearchesPlugin } from "../lib/Algolia";
import { appendHighlightTags } from "../utils/utils";

export default class Autocomplete extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      autocompleteState: {},
      query: "",
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

  onChange = ({ state }) => {
    this.setState({ autocompleteState: state, query: state.query });
  };

  renderQuerySuggestions = (items, index, source) => {
    return (
      <section key={`source-${index}`} className="aa-Source">
        {items.length > 0 && (
          <div>
            <span className="aa-SourceHeaderTitle">Suggestions</span>
            <div className="aa-SourceHeaderLine" />
            <ul className="aa-List" {...this.autocomplete.getListProps()}>
              {items.map((item) => {
                return (
                  <li
                    key={item.objectID}
                    className="aa-Item"
                    {...this.autocomplete.getItemProps({
                      item,
                      source,
                    })}
                  >
                    <div className="aa-ItemWrapper">
                      <div className="aa-ItemContent">
                        <div className="aa-ItemContentBody">
                          <div
                            className="aa-ItemContentTitle"
                            dangerouslySetInnerHTML={{
                              __html: appendHighlightTags(
                                item._highlightResult?.query?.value
                              ),
                            }}
                          />
                        </div>
                      </div>
                      <div className="aa-ItemActions">
                        <button
                          className="aa-ItemActionButton aa-DesktopOnly aa-ActiveOnly"
                          type="button"
                          title="Select"
                          style={{ pointerEvents: "none" }}
                        >
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.984 6.984h2.016v6h-15.188l3.609 3.609-1.406 1.406-6-6 6-6 1.406 1.406-3.609 3.609h13.172v-4.031z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    );
  };

  renderRecentSearch = (items, index, source) => {
    return (
      <section key={`source-${index}`} className="aa-Source">
        {items.length > 0 && (
          <div>
            <span className="aa-SourceHeaderTitle">Recent Searches</span>
            <div className="aa-SourceHeaderLine" />
            <ul className="aa-List" {...this.autocomplete.getListProps()}>
              {items.map((item) => {
                return (
                  <li
                    key={Math.random()}
                    className="aa-Item"
                    {...this.autocomplete.getItemProps({
                      item,
                      source,
                    })}
                  >
                    <div className="aa-ItemWrapper">
                      <div className="aa-ItemContent">
                        <div className="aa-ItemContentBody">
                          <div
                            className="aa-ItemContentTitle"
                            dangerouslySetInnerHTML={{
                              __html: appendHighlightTags(
                                item._highlightResult?.label.value
                              ),
                            }}
                          />
                        </div>
                      </div>
                      <div className="aa-ItemActions">
                        <button
                          className="aa-ItemActionButton aa-DesktopOnly aa-ActiveOnly"
                          type="button"
                          title="Select"
                          style={{ pointerEvents: "none" }}
                        >
                          <svg fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.984 6.984h2.016v6h-15.188l3.609 3.609-1.406 1.406-6-6 6-6 1.406 1.406-3.609 3.609h13.172v-4.031z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>
    );
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
    const { autocompleteState } = this.state;
    console.log("autocompleteState", autocompleteState);
    return (
      <div className="aa-Autocomplete" {...this.autocomplete.getRootProps({})}>
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

        {/* render suggestion */}
        {autocompleteState.isOpen && (
          <div
            ref={this.panelRef}
            className={[
              "aa-Panel",
              "aa-Panel--desktop",
              autocompleteState.status === "stalled" && "aa-Panel--stalled",
            ]
              .filter(Boolean)
              .join(" ")}
            {...this.autocomplete.getPanelProps({})}
          >
            <div className="aa-PanelLayout aa-Panel--scrollable">
              {autocompleteState.collections.map((collection, index) => {
                const { source, items } = collection;
                return source.sourceId === "querySuggestionsPlugin"
                  ? this.renderQuerySuggestions(items, index, source)
                  : this.renderRecentSearch(items, index, source);
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
}
