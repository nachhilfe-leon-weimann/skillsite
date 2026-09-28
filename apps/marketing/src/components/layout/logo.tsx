import Image from "next/image";

import { cn } from "@skillsite/ui/utils/cn";
import { brand } from "@/content/site";

type LogoProps = {
  showText?: boolean;
  /** `inverse` on navy surfaces (footer). */
  tone?: "default" | "inverse";
  className?: string;
  textClassName?: string;
};

export function Logo({
  showText = true,
  tone = "default",
  className,
  textClassName,
}: LogoProps) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <Image
        src={brand.logo}
        alt={brand.name}
        width={42}
        height={41}
        priority
        className="rounded-xl shadow-[0_5px_14px_-5px_rgba(16,29,45,0.5)]"
      />
      {showText ? (
        <span className={cn("flex flex-col leading-[1.08]", textClassName)}>
          <span
            className={cn(
              "font-heading text-[1.04rem] font-bold tracking-[-0.01em]",
              tone === "inverse" ? "text-white" : "text-ink",
            )}
          >
            {brand.name}
          </span>
          <span
            className={cn(
              "whitespace-nowrap text-[0.71rem] tracking-[0.03em]",
              tone === "inverse" ? "text-on-navy-soft" : "text-ink-soft",
            )}
          >
            {brand.tagline}
          </span>
        </span>
      ) : null}
    </span>
  );
}
