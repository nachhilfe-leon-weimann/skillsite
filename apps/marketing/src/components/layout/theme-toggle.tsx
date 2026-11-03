"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { cn } from "@skillsite/ui/utils/cn";
import { useHydrated } from "@skillsite/ui/hooks/use-hydrated";

type ThemeOverride = "light" | "dark";

type ThemeOption = {
  value: ThemeOverride;
  label: string;
  Icon: typeof Sun;
  activeClassName: string;
};

const SYSTEM_THEME = "system";

const segmentClass =
  "relative z-raised inline-flex min-h-0 min-w-0 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-caption font-semibold transition-colors duration-base ease-flow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-overlay-40 sm:px-4";

const inactiveSegmentClass = "text-on-navy-soft hover:text-white";

const themeOptions = [
  { value: "light", label: "Hell", Icon: Sun, activeClassName: "text-navy" },
  { value: "dark", label: "Dunkel", Icon: Moon, activeClassName: "text-white" },
] satisfies readonly ThemeOption[];

function isThemeOverride(theme: string | undefined): theme is ThemeOverride {
  return theme === "light" || theme === "dark";
}

function getSelectedTheme(theme: string | undefined, mounted: boolean) {
  return mounted && isThemeOverride(theme) ? theme : undefined;
}

function useThemeIndicator(selectedTheme: ThemeOverride | undefined) {
  // The animated indicator is driven by a local mirror of the selected theme,
  // updated on the next frame instead of synchronously. Two reasons:
  //   1. next-themes runs with `disableTransitionOnChange`, which injects
  //      `* { transition: none !important }` for ~1ms on every theme switch to
  //      avoid a page-wide colour flash. Moving the indicator a frame later lets
  //      its glide escape that suppression window — otherwise it snaps.
  //   2. `ready` gates the transition so the indicator snaps to the stored theme
  //      on first load instead of sliding in.
  // `indicatorTheme` drives visibility (opacity) and the active label colour;
  // `indicatorPosition` drives the pill's horizontal position and background.
  // They are split so that deselecting (indicatorTheme → null) fades the pill out
  // in place instead of sliding it back to the light slot.
  const [indicatorTheme, setIndicatorTheme] = useState<ThemeOverride | null>(
    null,
  );
  const [indicatorPosition, setIndicatorPosition] =
    useState<ThemeOverride>("light");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const targetTheme = selectedTheme ?? null;
    // Two frames, not one: next-themes closes its `transition: none` window via
    // `setTimeout(remove, 1)`. A single rAF fired right at a frame boundary can
    // win that race and commit the transform while suppression is still active,
    // making the indicator snap. The second frame clears the 1ms window for good.
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        setIndicatorTheme(targetTheme);
        // Position only follows an actual override; on deselect it stays put so
        // the pill fades out where it is rather than gliding to the light slot.
        if (targetTheme !== null) setIndicatorPosition(targetTheme);
      });
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [selectedTheme]);

  useEffect(() => {
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => setIsReady(true));
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, []);

  return {
    indicatorTheme,
    indicatorPosition,
    isReady,
  };
}

/** Segmented light/dark override. No active segment means system theme. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useHydrated();
  const resetId = useId();

  const selectedTheme = getSelectedTheme(theme, mounted);
  const hasOverride = selectedTheme !== undefined;
  const { indicatorTheme, indicatorPosition, isReady } =
    useThemeIndicator(selectedTheme);

  function toggleTheme(target: ThemeOverride) {
    setTheme(selectedTheme === target ? SYSTEM_THEME : target);
  }

  return (
    <div
      role="group"
      aria-label="Farbschema wählen"
      aria-describedby={hasOverride ? resetId : undefined}
      className="relative grid grid-cols-2 rounded-full border border-overlay-15 bg-overlay-7 p-1"
    >
      <span
        aria-hidden
        // The indicator moves via an inline transform so its glide does not depend on
        // Tailwind's translate utilities; either way the transition must list the
        // property it animates.
        style={{
          transform:
            indicatorPosition === "dark" ? "translateX(100%)" : "translateX(0)",
        }}
        className={cn(
          "pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full",
          isReady &&
            "transition-[transform,background-color,opacity] duration-base ease-flow",
          indicatorPosition === "dark" ? "bg-overlay-20" : "bg-white",
          indicatorTheme ? "opacity-100" : "opacity-0",
        )}
      />
      {themeOptions.map(({ value, label, Icon, activeClassName }) => (
        <button
          key={value}
          type="button"
          aria-label={label}
          aria-pressed={mounted ? selectedTheme === value : undefined}
          onClick={() => toggleTheme(value)}
          className={cn(
            segmentClass,
            indicatorTheme === value ? activeClassName : inactiveSegmentClass,
          )}
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          <span className="truncate max-lg:hidden text-caption">{label}</span>
        </button>
      ))}
      <span id={resetId} className="sr-only">
        Aktive Auswahl erneut wählen, um der Systemeinstellung zu folgen.
      </span>
    </div>
  );
}
