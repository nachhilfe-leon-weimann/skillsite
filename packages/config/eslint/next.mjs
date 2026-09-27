import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Shared flat-config preset for Next.js apps in this workspace.
 * Module-boundary rules join here once the portal's feature modules exist.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.tsx"],
    rules: {
      // One spelling for hidden decoration: the shorthand `aria-hidden`.
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "JSXAttribute[name.name='aria-hidden'][value.type='Literal'][value.value='true']",
          message:
            'Write the shorthand `aria-hidden` instead of `aria-hidden="true"`.',
        },
        {
          selector:
            "JSXAttribute[name.name='aria-hidden'] > JSXExpressionContainer > Literal[value=true]",
          message:
            "Write the shorthand `aria-hidden` instead of `aria-hidden={true}`.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Storybook build output.
    "storybook-static/**",
  ]),
]);
