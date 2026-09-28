import { IconBadge } from "../primitives/icon-badge";
import { Heading } from "../typography/heading";

type CenteredStateProps = {
  /** The state's icon (or a spinner); it sets its own size and colour. */
  icon: React.ReactNode;
  title: React.ReactNode;
  /** The message and its actions. */
  children?: React.ReactNode;
};

/**
 * A centred message inside a panel - loading, empty, done or failed - that rises
 * in on mount. The panel must be a flex column for `m-auto` to centre it.
 */
export function CenteredState({ icon, title, children }: CenteredStateProps) {
  return (
    <div className="m-auto max-w-sm text-center motion-safe:animate-rise [--reveal-travel:6px] motion-safe:[animation-delay:80ms]">
      <IconBadge
        as="div"
        size="14"
        shape="full"
        tone="accent-16"
        className="mx-auto mb-4"
      >
        {icon}
      </IconBadge>
      <Heading as="h3" size="h4" className="mb-2">
        {title}
      </Heading>
      {children}
    </div>
  );
}
