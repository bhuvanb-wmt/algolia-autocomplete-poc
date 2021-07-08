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

const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const capitalizeFirstLetters = (str) => {
  const words = str.split(" ");
  let newStr = "";
  words.forEach((word) => {
    newStr += capitalizeFirstLetter(word);
    newStr += " ";
  });
  newStr = newStr.substring(0, newStr.length - 1);
  return newStr;
};
