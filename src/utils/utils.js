export const appendHighlightTags = (str) => {
  return str
    ?.replace("__aa-highlight__", "<mark>")
    ?.replace("__/aa-highlight__", "</mark>")
    ?.trim();
};
