// Capitalize each word (for non-email text fields)
// Capitalize each word while preserving trailing space during typing
export const capitalizeWords = (value = "") => {
  const hasTrailingSpace = /\s$/.test(value);
  const cleaned = value.replace(/\s+/g, " ").trim();
  const capped = cleaned
    .split(" ")
    .map((word) =>
      word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ""
    )
    .join(" ");
  return hasTrailingSpace ? `${capped} ` : capped;
};
