"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  createContext,
  use,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";

import { cn } from "../utils/cn";

type PopoverContextValue = {
  open: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopover(component: string) {
  const context = use(PopoverContext);
  if (!context) throw new Error(`${component} must be used inside <Popover>`);
  return context;
}

type PopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

/**
 * Controlled, non-modal popover. Radix owns presence, outside interaction and
 * Escape; the page stays reachable (no focus trap, scroll lock or hidden page).
 */
export function Popover({ open, onOpenChange, children }: PopoverProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
    >
      <PopoverContext value={{ open, triggerRef }}>{children}</PopoverContext>
    </PopoverPrimitive.Root>
  );
}

/**
 * Composes its single child (e.g. a `Button`) as the trigger. A child `onClick`
 * that calls `event.preventDefault()` replaces the built-in open toggle.
 */
export function PopoverTrigger({ children }: { children: React.ReactElement }) {
  const { triggerRef } = usePopover("PopoverTrigger");
  return (
    <PopoverPrimitive.Trigger asChild ref={triggerRef}>
      {children}
    </PopoverPrimitive.Trigger>
  );
}

type PopoverContentProps = {
  /** Accessible name of the panel. */
  label: string;
  children: React.ReactNode;
  /** Extra classes for the panel surface (width, layout). */
  className?: string;
  align?: "start" | "center" | "end";
  /** Prevent default to let navigation choose its own focus destination. */
  onCloseAutoFocus?: (event: Event) => void;
};

/**
 * The panel, rendered in place right after its trigger: it follows the trigger
 * in the tab order and inherits theme and stacking. Opening never moves focus.
 * Closing returns focus to the trigger only if the panel held it; Escape does
 * so at once, other closes after the exit transition.
 */
export function PopoverContent({
  label,
  children,
  className,
  align = "center",
  onCloseAutoFocus,
}: PopoverContentProps) {
  const { open, triggerRef } = usePopover("PopoverContent");
  const contentRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);

  // Closed content is inert at once, also while its exit transition runs.
  // Note whether it held focus first, before inert drops that focus; a reopen
  // during the exit keeps that note while focus still sits on <body>.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const { activeElement, body } = content.ownerDocument;
    if (!open)
      restoreFocusRef.current =
        content.contains(activeElement) ||
        (restoreFocusRef.current && activeElement === body);
    content.inert = !open;
    if (open) content.removeAttribute("aria-hidden");
    else content.setAttribute("aria-hidden", "true");
    // Radix's positioning wrapper would still catch pointer hits under the
    // fading panel; open, the panel itself takes them (hover corridor included).
    const wrapper = content.parentElement;
    if (wrapper?.hasAttribute("data-radix-popper-content-wrapper"))
      wrapper.style.pointerEvents = open ? "" : "none";
  }, [open]);

  const holdsFocus = () =>
    !!contentRef.current?.contains(document.activeElement);

  return (
    <PopoverPrimitive.Content
      ref={contentRef}
      aria-label={label}
      side="bottom"
      align={align}
      onOpenAutoFocus={(event) => event.preventDefault()}
      onEscapeKeyDown={() => {
        if (holdsFocus()) triggerRef.current?.focus({ preventScroll: true });
      }}
      onCloseAutoFocus={(event) => {
        onCloseAutoFocus?.(event);
        const restore = restoreFocusRef.current && !event.defaultPrevented;
        // Replace Radix's default, which would focus the trigger even when
        // focus is elsewhere on the page.
        event.preventDefault();
        restoreFocusRef.current = false;
        const trigger = triggerRef.current;
        const active = document.activeElement;
        if (
          restore &&
          trigger?.isConnected &&
          (!active || active === document.body)
        )
          trigger.focus({ preventScroll: true });
      }}
      // Reversible transitions, so an interrupted open or close turns around
      // smoothly; presence-hold keeps closing content mounted until it ends.
      className="z-raised outline-none transition-[opacity,translate] duration-base ease-flow starting:translate-y-2 starting:opacity-0 data-[side=bottom]:pt-1.5 data-[side=top]:pb-1.5 data-[state=closed]:pointer-events-none data-[state=closed]:translate-y-2 data-[state=closed]:opacity-0 data-[state=closed]:animate-presence-hold"
    >
      <div
        // Radix loops Tab inside even a non-modal popover. Leave Tab to the
        // browser, so focus moves on through the page (and the panel closes).
        // This also hides Tab keydowns inside the panel from ancestor React
        // handlers and from bubble-phase document/window listeners.
        onKeyDown={(event) => {
          if (event.key === "Tab") event.stopPropagation();
        }}
        className={cn(
          "rounded-2xl border border-line bg-surface p-2 shadow-card",
          className,
        )}
      >
        {children}
      </div>
    </PopoverPrimitive.Content>
  );
}
