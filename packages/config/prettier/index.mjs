/**
 * Shared Prettier preset. The values are Prettier's defaults, written out so the house style is explicit.
 * No Tailwind class sorting: reordering classes can change which conflicting class `cn` keeps.
 * @type {import("prettier").Config}
 */
export default {
  printWidth: 80,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
};
