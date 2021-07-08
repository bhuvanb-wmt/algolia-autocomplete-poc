import AlgoliaSDK from "@6thstreetdotcom/algolia-sdk";
import { createQuerySuggestionsPlugin } from "@algolia/autocomplete-plugin-query-suggestions";
import { createLocalStorageRecentSearchesPlugin } from "@algolia/autocomplete-plugin-recent-searches";
import algoliasearch from "algoliasearch/lite";
import axios from "axios";
import { queryString } from "../utils/utils";

// stage
// const APPLICATION_ID = "testingYRFDV96GMU";
// const API_KEY = "e92425b71fb8567025fd735b21be56e1";
// const SOURCE_INDEX_API_KEY = "e92425b71fb8567025fd735b21be56e1";
// export const indexName = "stage_magento_english_products_query_suggestions";
// export const sourceIndexName = "stage_magento_english_products";
// prod
const APPLICATION_ID = "02X7U6O3SI";
const API_KEY = "1585b8474aaca857f922d1888f76f38e";
const SOURCE_INDEX_API_KEY = "1c1f24f9c49cbf42d872fcf91746fc21";
export const indexName =
  "enterprise_magento_english_products_query_suggestions";
export const sourceIndexName = "enterprise_magento_en_kw_products";

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
  try {
    const res = await index.search(query, {
      hitsPerPage: 5,
    });
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

export async function getTopSearches() {
  try {
    const res = await axios.get(
      `https://analytics.algolia.com/2/searches?index=${sourceIndexName}&limit=5&tags=PWA_Search`,
      {
        headers: {
          "X-Algolia-API-Key": SOURCE_INDEX_API_KEY,
          "X-Algolia-Application-Id": APPLICATION_ID,
        },
      }
    );
    // console.log("top searches", res);
    return res.data.searches;
  } catch (e) {
    console.log(e.response);
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
    console.log("params in get plp", params);
    const queryParams = {
      ...params,
      locale: "en-ae",
    };
    // const tag = ["PWA_Search"];
    const url = queryString(queryParams);
    console.log("url", url);
    const res = await AlgoliaSDK.getPLP(`/?${url}`);

    return res;
  },

  search: AlgoliaSDK.search,

  getClient: () => AlgoliaSDK.client,
  getIndex: () => AlgoliaSDK.index,
};

algoliaSDK.init(APPLICATION_ID, SOURCE_INDEX_API_KEY);
