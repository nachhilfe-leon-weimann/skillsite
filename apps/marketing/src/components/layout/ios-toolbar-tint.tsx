"use client";

import { useEffect, useState } from "react";

/** Fired (on window) with the mobile menu's open state so the tint can react. */
export const MENU_STATE_EVENT = "skillsite:menu-state";
export type MenuStateDetail = { open: boolean };

/**
 * iOS 26 Safari tints the floating bottom toolbar by sampling the
 * background-color of a `fixed` element pinned to the bottom edge (it ignores
 * `theme-color` and reports `env(safe-area-inset-*)` as 0). We only want the
 * navy tint once the footer is in view - otherwise the toolbar stays the page
 * colour while scrolling.
 *
 * Safari only re-samples when a fixed element's `display` actually changes, and
 * two fixed elements fight over the bottom edge:
 *   - this strip (footer IntersectionObserver toggles `is-active`: none <-> navy);
 *   - the full-screen mobile menu (also fixed, coloured by the page bg).
 *
 * So we listen for the menu state:
 *   - while the menu is OPEN we force this strip hidden, so Safari samples the
 *     menu (page colour) instead of a stale navy strip underneath it;
 *   - when it CLOSES we briefly flip to the opposite display of the resting
 *     state, forcing a real display change so Safari re-samples (otherwise a
 *     menu-coloured toolbar would stick).
 */
export function IosToolbarTint() {
  const [active, setActive] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    const footer = document.querySelector("footer");
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry?.isIntersecting ?? false),
      { threshold: 0 },
    );
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let outer = 0;
    let inner = 0;
    const onMenuState = (event: Event) => {
      const { open } = (event as CustomEvent<MenuStateDetail>).detail;
      setMenuOpen(open);
      if (open) return;
      // Menu closed: force a re-sample so a menu-coloured toolbar clears.
      // Two frames so the opposite-display state commits before we revert.
      setNudge(true);
      outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setNudge(false));
      });
    };
    window.addEventListener(MENU_STATE_EVENT, onMenuState);
    return () => {
      window.removeEventListener(MENU_STATE_EVENT, onMenuState);
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, []);

  // During a nudge, show the opposite display of the resting state so the
  // return to rest is a real display change. While the menu is open, stay
  // hidden so the menu colours the toolbar. Otherwise: navy at the footer,
  // hidden elsewhere.
  const className = nudge
    ? active
      ? undefined // footer visible → hide briefly, then back to navy
      : "is-nudge" // footer hidden → show briefly, then back to none
    : menuOpen
      ? undefined
      : active
        ? "is-active"
        : undefined;

  return <div id="ios-toolbar-tint" className={className} aria-hidden />;
}
