import { Container } from "@/components/layout/container";
import { Eyebrow } from "@skillsite/ui/typography/eyebrow";
import { Reveal } from "@skillsite/ui/motion/reveal";
import { Heading } from "@skillsite/ui/typography/heading";
import { Lead } from "@skillsite/ui/typography/lead";
import { cn } from "@skillsite/ui/utils/cn";

type PageHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  size?: "display" | "h1";
  titleClassName?: string;
  /** Buttons / actions rendered below the lead. */
  children?: React.ReactNode;
};

/** The top-of-page intro pattern: eyebrow + H1 + lead (+ optional actions). */
export function PageHeader({
  eyebrow,
  title,
  lead,
  align = "left",
  size = "h1",
  titleClassName,
  children,
}: PageHeaderProps) {
  const centered = align === "center";
  // Sequential stagger index across whichever elements are present.
  let step = 0;

  return (
    <Container
      className={cn(
        "pt-[clamp(2.5rem,6vw,4.5rem)] pb-[clamp(1.25rem,3vw,2rem)]",
        centered && "text-center",
      )}
    >
      {eyebrow ? (
        <Reveal
          trigger="mount"
          variant="rise-soft"
          index={step++}
          className={cn(centered && "flex justify-center")}
        >
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}
      <Reveal
        trigger="mount"
        variant="rise-soft"
        index={step++}
        className={cn(eyebrow && "mt-4")}
      >
        <Heading
          as="h1"
          size={size}
          className={cn(centered && "mx-auto", titleClassName)}
        >
          {title}
        </Heading>
      </Reveal>
      {lead ? (
        <Reveal
          trigger="mount"
          variant="rise-soft"
          index={step++}
          className="mt-5"
        >
          <Lead className={cn("max-w-[34em]", centered && "mx-auto")}>
            {lead}
          </Lead>
        </Reveal>
      ) : null}
      {children ? (
        <Reveal
          trigger="mount"
          variant="rise-soft"
          index={step++}
          className={cn(
            "mt-7 flex flex-wrap gap-3.5",
            centered && "justify-center",
          )}
        >
          {children}
        </Reveal>
      ) : null}
    </Container>
  );
}
