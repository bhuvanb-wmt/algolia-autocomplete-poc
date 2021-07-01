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
const index = searchClient.initIndex(indexName);

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

export async function getSuggestions(query) {
  console.log("query", query);
  try {
    const res = await index.search(query, {
      hitsPerPage: 5,
    });
    console.log("result", res);
    return res.hits;
  } catch (e) {
    console.log(e);
  }
}

export async function setRecentSearches(query, userID) {
  let searches = [];
  try {
    const res = await index.getObject(userID);
    searches = [...res.searches, query];
    searches = searches.length > 5 ? searches.slice(1) : searches;
    const data = [{ objectID: userID, searches }];
    await index.saveObjects(data);
    return searches;
  } catch (e) {
    console.log(e);
    searches = [query];
    const data = [{ objectID: userID, searches }];
    await index.saveObjects(data);
    return searches;
  }
}

export async function getRecentSearches(userID) {
  try {
    const res = await index.getObject(userID);
    console.log(res);
    return res.searches;
  } catch (e) {
    console.log(e);
  }
}

export const algoliaSDK = {
  init: (appID, adminKey) => {
    AlgoliaSDK.init(appID, adminKey);
  },

  setIndex: () => {
    AlgoliaSDK.setIndex("en-ae", "enterprise");
  },

  getPLP: async (params = {}, options = {}) => {
    const queryParams = {
      ...params,
      locale: "en-ae",
    };
    const tag = ["mobile", "PLP"];
    const url = queryString.parse(queryParams);

    const res = await AlgoliaSDK.getPLP(`/?${url}`, options, tag);

    return res;
  },

  search: AlgoliaSDK.search,

  getClient: () => AlgoliaSDK.client,
  getIndex: () => AlgoliaSDK.index,
};

algoliaSDK.init(APPLICATION_ID, API_KEY);
