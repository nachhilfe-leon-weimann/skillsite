"use client";

import { useEffect, useState } from "react";

import { NavLink } from "@skillsite/ui/primitives/link";
import { Card } from "@skillsite/ui/primitives/card";

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
    <Card asChild className="p-4 text-prose-sm">
      <nav aria-label="Abschnitte dieser Seite">
        <p className="mb-3 px-2 text-prose-xs font-semibold uppercase tracking-wide text-ink-soft">
          Auf dieser Seite
        </p>
        <ul className="space-y-1">
          {sections.map((section) => (
            <li key={section.id}>
              <NavLink
                variant="toc"
                href={`#${section.id}`}
                active={active === section.id}
              >
                {section.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </Card>
  );
}
