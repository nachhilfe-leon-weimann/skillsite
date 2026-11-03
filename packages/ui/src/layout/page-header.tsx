import { Reveal } from "../motion/reveal";
import { Eyebrow } from "../typography/eyebrow";
import { Heading, type HeadingSize } from "../typography/heading";
import { Lead } from "../typography/lead";
import { cn } from "../utils/cn";
import { Container } from "./container";

type PageHeaderProps = {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "left" | "center";
  /**
   * `page`: the route's h1 intro, in a Container with the page-top spacing,
   * revealed on mount (above the fold). `section`: an h2 intro inside a
   * section, revealed when it scrolls into view, with tighter spacing.
   */
  variant?: "page" | "section";
  /** Type-scale size of the title; `h1` for a page, `h2` for a section by default. */
  size?: Extract<HeadingSize, "display" | "h1" | "h2" | "h3">;
  /** Wrapper classes (section variant). */
  className?: string;
  titleClassName?: string;
  leadClassName?: string;
  /** Buttons / actions rendered below the lead. */
  children?: React.ReactNode;
};

/** Eyebrow + heading (+ lead, + actions): the intro of a page or a section. */
export function PageHeader({
  eyebrow,
  title,
  lead,
  align = "left",
  variant = "page",
  size = variant === "page" ? "h1" : "h2",
  className,
  titleClassName,
  leadClassName,
  children,
}: PageHeaderProps) {
  const page = variant === "page";
  const centered = align === "center";
  const trigger = page ? "mount" : "in-view";
  // Sequential stagger index across whichever elements are present.
  let step = 0;

  const content = (
    <>
      {eyebrow ? (
        <Reveal
          trigger={trigger}
          variant="rise-soft"
          index={step++}
          className={cn(centered && "flex justify-center")}
        >
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
      ) : null}
      <Reveal
        trigger={trigger}
        variant="rise-soft"
        index={step++}
        className={cn(eyebrow && "mt-4")}
      >
        <Heading
          as={page ? "h1" : "h2"}
          size={size}
          className={cn(page && centered && "mx-auto", titleClassName)}
        >
          {title}
        </Heading>
      </Reveal>
      {lead ? (
        <Reveal
          trigger={trigger}
          variant="rise-soft"
          index={step++}
          className={page ? "mt-5" : "mt-4"}
        >
          <Lead
            className={cn(
              "max-w-measure-34",
              centered && "mx-auto",
              leadClassName,
            )}
          >
            {lead}
          </Lead>
        </Reveal>
      ) : null}
      {children ? (
        <Reveal
          trigger={trigger}
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
    </>
  );

  return page ? (
    <Container
      className={cn(
        "pt-page-top pb-page-header-bottom",
        centered && "text-center",
      )}
    >
      {content}
    </Container>
  ) : (
    <div className={cn(centered && "text-center", className)}>{content}</div>
  );
}
