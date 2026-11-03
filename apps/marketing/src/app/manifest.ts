import type { MetadataRoute } from "next";

import { brandColors } from "@skillsite/ui/tokens/colors";
import { brand } from "@/content/site";

// Web app manifest. Next serves this at /manifest.webmanifest and auto-injects
// the <link rel="manifest"> tag. The 512px icon reuses the file-based app icon;
// the smaller install icon lives in public. apple-icon.png is declared
// separately by Next as an Apple touch icon and does not belong in the manifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: "Nachhilfe",
    description:
      "Persönliche Online-Nachhilfe in Mathematik, Informatik und Physik.",
    lang: "de",
    start_url: "/",
    display: "standalone",
    // Matches the light theme-color in the root viewport export.
    background_color: brandColors.bg,
    theme_color: brandColors.bg,
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
