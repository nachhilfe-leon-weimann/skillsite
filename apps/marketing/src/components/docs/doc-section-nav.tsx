"use client";

import { useEffect, useState } from "react";

import { cn } from "@skillsite/ui/utils/cn";

export type DocNavSection = { id: string; label: string };

/** Sticky table of contents with scrollspy highlighting. */
export function DocSectionNav({ sections }: { sections: DocNavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );

    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Abschnitte dieser Seite"
      className="rounded-2xl border border-line bg-surface p-4 text-prose-sm shadow-card"
    >
      <p className="mb-3 px-2 text-prose-xs font-semibold uppercase tracking-wide text-ink-soft">
        Auf dieser Seite
      </p>
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className={cn(
                "block rounded-lg px-2 py-1.5 transition-colors",
                active === section.id
                  ? "bg-surface-2 font-medium text-ink"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
