import AlgoliaSDK from "@6thstreetdotcom/algolia-sdk";
import { createQuerySuggestionsPlugin } from "@algolia/autocomplete-plugin-query-suggestions";
import { createLocalStorageRecentSearchesPlugin } from "@algolia/autocomplete-plugin-recent-searches";
import algoliasearch from "algoliasearch/lite";
import queryString from "query-string";

const APPLICATION_ID = "testingYRFDV96GMU";
const API_KEY = "e92425b71fb8567025fd735b21be56e1";
export const indexName = "stage_magento_english_products_query_suggestions";
export const sourceIndexName = "stage_magento_english_products";
const searchClient = algoliasearch(APPLICATION_ID, API_KEY);

export function recentSearchesPlugin() {
  return createLocalStorageRecentSearchesPlugin({
    searchClient,
    indexName,
  });
}

export function querySuggestionsPlugin() {
  return createQuerySuggestionsPlugin({
    searchClient,
    indexName,
  });
}

export const algoliaSDK = {
  init: (appID, adminKey) => {
    AlgoliaSDK.init(appID, adminKey);
  },

  setIndex: () => {
    AlgoliaSDK.setIndex("en-ae", "stage");
  },

  getPLP: async (params = {}, options = {}) => {
    const queryParams = {
      ...params,
      locale: "en-ae",
    };
    const tag = ["PWA_Search", "PLP"];
    const url = queryString(queryParams);

    const res = await AlgoliaSDK.getPLP(`/?${url}`, options, tag);

    return res;
  },

  search: AlgoliaSDK.search,

  getClient: () => AlgoliaSDK.client,
  getIndex: () => AlgoliaSDK.index,
};
