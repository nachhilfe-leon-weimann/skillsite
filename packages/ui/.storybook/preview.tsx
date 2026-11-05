import React from "react";

import type { Preview } from "@storybook/nextjs-vite";

import "./preview.css";

import { fontVariables } from "../src/shell/fonts";

/* The brand fonts: the same next/font module as the apps, so the workbench
   renders Bricolage Grotesque and Hanken Grotesk, not the system fallback. */
const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Colour scheme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === "dark" ? "dark" : "light";
      // A story whose own ThemeProvider sets `data-theme` (`ownsTheme`) keeps it.
      // Every other story also drops the inline `color-scheme` that provider
      // leaves on <html>, which would override the theme's own scheme.
      if (!context.parameters.ownsTheme) {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.removeProperty("color-scheme");
      }
      document.documentElement.classList.add(...fontVariables.split(" "));
      return <Story />;
    },
  ],
};

export default preview;
