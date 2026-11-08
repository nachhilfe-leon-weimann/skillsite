import { IconBadge } from "../primitives/icon-badge";
import { Heading } from "../typography/heading";
import { cn } from "../utils/cn";

type CenteredStateProps = {
  /** The state's icon (or a spinner); it sets its own size and colour. */
  icon: React.ReactNode;
  title: React.ReactNode;
  /** The message and its actions. */
  children?: React.ReactNode;
  /** `-1` lets the state take focus from script, e.g. when it replaced the focused content. */
  tabIndex?: -1;
  ref?: React.Ref<HTMLDivElement>;
  /**
   * Makes the title a focus target for script (`tabIndex` -1), e.g. when the
   * state replaced the control that held focus. It draws no focus ring: it is
   * no control, and focusing it moves nothing on screen.
   */
  focusableTitle?: boolean;
  titleRef?: React.Ref<HTMLHeadingElement>;
};

/**
 * A centred message inside a panel - loading, empty, done or failed - that rises
 * in on mount. The panel must be a flex column for `m-auto` to centre it.
 */
export function CenteredState({
  icon,
  title,
  children,
  tabIndex,
  ref,
  focusableTitle = false,
  titleRef,
}: CenteredStateProps) {
  return (
    <div
      ref={ref}
      tabIndex={tabIndex}
      className="m-auto max-w-sm text-center motion-safe:animate-rise [--reveal-travel:6px] motion-safe:[animation-delay:80ms]"
    >
      <IconBadge
        as="div"
        size="14"
        shape="full"
        tone="accent-16"
        className="mx-auto mb-4"
      >
        {icon}
      </IconBadge>
      <Heading
        as="h3"
        size="h4"
        ref={titleRef}
        tabIndex={focusableTitle ? -1 : undefined}
        className={cn("mb-2", focusableTitle && "outline-none")}
      >
        {title}
      </Heading>
      {children}
    </div>
  );
}
