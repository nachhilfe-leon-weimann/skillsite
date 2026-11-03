import Image from "next/image";

import { cn } from "../utils/cn";

type LogoProps = {
  /** Brand name: the image's alt text and the first text line. */
  name: string;
  /** Second text line. */
  tagline: string;
  /** Logo image (a path under the app's `public/`). */
  src: string;
  showText?: boolean;
  /** `inverse` on navy surfaces (footer). */
  tone?: "default" | "inverse";
  className?: string;
  textClassName?: string;
};

/** Logo mark plus name and tagline; the app passes its brand. */
export function Logo({
  name,
  tagline,
  src,
  showText = true,
  tone = "default",
  className,
  textClassName,
}: LogoProps) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <Image
        src={src}
        alt={name}
        width={42}
        height={41}
        priority
        className="rounded-xl shadow-logo"
      />
      {showText ? (
        <span className={cn("flex flex-col leading-[1.08]", textClassName)}>
          <span
            className={cn(
              "font-heading text-logo font-bold tracking-[-0.01em]",
              tone === "inverse" ? "text-white" : "text-ink",
            )}
          >
            {name}
          </span>
          <span
            className={cn(
              "whitespace-nowrap text-logo-tagline tracking-[0.03em]",
              tone === "inverse" ? "text-on-navy-soft" : "text-ink-soft",
            )}
          >
            {tagline}
          </span>
        </span>
      ) : null}
    </span>
  );
}
