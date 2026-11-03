"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@skillsite/ui/utils/cn";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { testimonials, testimonialsAreExamples } from "@/content/testimonials";

export function Testimonials() {
  const [index, setIndex] = useState(0);
  const count = testimonials.length;
  const active = ((index % count) + count) % count;
  const current = testimonials[active];
  if (!current) return null;

  return (
    <div className="mx-auto max-w-220 px-6 py-section text-center">
      <Eyebrow>
        {testimonialsAreExamples ? "Beispielstimmen" : "Was andere sagen"}
      </Eyebrow>

      {/* Keyed so each change replays the fade — a soft crossfade between voices. */}
      <div key={active} className="motion-safe:animate-fade">
        <blockquote className="mt-6 font-heading text-quote-lg font-medium leading-[1.28] tracking-[-0.015em] text-ink">
          „{current.quote}“
        </blockquote>

        <div className="mt-6 font-semibold text-ink">{current.name}</div>
        <div className="text-quote-source text-ink-soft">{current.detail}</div>
      </div>

      <div className="mt-7 flex items-center justify-center gap-3.5">
        <button
          type="button"
          onClick={() => setIndex(index - 1)}
          aria-label="Vorherige Stimme"
          className="flex size-11 items-center justify-center rounded-full border border-line bg-bg text-ink transition-colors hover:border-ink"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
        <div className="flex gap-2">
          {testimonials.map((item, i) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Stimme ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "size-2.25 rounded-full transition-colors",
                i === active ? "bg-coral" : "bg-line",
              )}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIndex(index + 1)}
          aria-label="Nächste Stimme"
          className="flex size-11 items-center justify-center rounded-full border border-line bg-bg text-ink transition-colors hover:border-ink"
        >
          <ArrowRight className="size-5" aria-hidden />
        </button>
      </div>

      {testimonialsAreExamples ? (
        <p className="mt-6 text-footnote text-ink-soft">
          Diese Stimmen illustrieren typisches Feedback – echte, freigegebene
          Referenzen folgen.
        </p>
      ) : null}
    </div>
  );
}
