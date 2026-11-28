import { aboutPage } from "@/content/about";
import { bookingPage } from "@/content/booking";
import { contactPage } from "@/content/contact";
import { agbPage } from "@/content/legal/agb";
import { privacyPage } from "@/content/legal/datenschutz";
import { impressumPage } from "@/content/legal/impressum";
import { onlineLearningPage } from "@/content/online-learning";
import { pricingPage } from "@/content/pricing";
import { processPage } from "@/content/process";
import { paymentPage } from "@/content/status";
import { subjectsPage } from "@/content/subjects";
import { siteMetadata, templatedTitle } from "@/lib/metadata";
import { routes } from "@/lib/routes";

/** The home page's tab title: the site's default, without the template. */
const homeTitle =
  typeof siteMetadata.title === "object" &&
  siteMetadata.title !== null &&
  "default" in siteMetadata.title
    ? siteMetadata.title.default
    : undefined;

/**
 * The tab title of each page, read from the same content metadata the page
 * declares, so analytics names a page as its browser tab does.
 */
const pageTitles: ReadonlyMap<string, string | undefined> = new Map([
  [routes.home, homeTitle],
  [routes.subjects, templatedTitle(subjectsPage.metadata.title)],
  [routes.process, templatedTitle(processPage.metadata.title)],
  [routes.pricing, templatedTitle(pricingPage.metadata.title)],
  [routes.about, templatedTitle(aboutPage.metadata.title)],
  [routes.contact, templatedTitle(contactPage.metadata.title)],
  [routes.booking, templatedTitle(bookingPage.metadata.title)],
  [routes.onlineLearning, templatedTitle(onlineLearningPage.metadata.title)],
  [routes.payment, templatedTitle(paymentPage.metadata.title)],
  [routes.impressum, templatedTitle(impressumPage.metadata.title)],
  [routes.datenschutz, templatedTitle(privacyPage.metadata.title)],
  [routes.agb, templatedTitle(agbPage.metadata.title)],
]);

/** The tab title of a page path; `undefined` for a path that is no page. */
export function pageTitle(pathname: string): string | undefined {
  return pageTitles.get(pathname);
}

/** Every page path with a title, for the test that keeps the map complete. */
export const titledPaths: readonly string[] = [...pageTitles.keys()];
