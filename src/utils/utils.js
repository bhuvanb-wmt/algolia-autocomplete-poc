export const appendHighlightTags = (str) => {
  return str
    ?.replace(/__aa-highlight__/g, "<mark>")
    ?.replace(/__\/aa-highlight__/g, "</mark>")
    ?.trim();
};

export const toKebabCase = (str) => {
  return str
    ?.replace(/([a-z])([A-Z])/g, "$1-$2")
    ?.replace(/\s+/g, "-")
    ?.toLowerCase();
};

export const queryString = (obj) => {
  return Object.keys(obj)
    .map((key) => `${key}=${encodeURIComponent(obj[key])}`)
    .join("&");
};
