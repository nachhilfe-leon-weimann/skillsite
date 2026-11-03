"use client";

import * as PopoverPrimitive from "@radix-ui/react-popover";
import {
  createContext,
  use,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
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
  /**
   * While closing, keep the panel's area hit-testable (its links stay inert), so
   * a hover consumer can reopen it when the pointer comes back. Otherwise the
   * closing panel lets every pointer hit through to the page.
   */
  hitTestableExit?: boolean;
  /** Prevent default to let navigation choose its own focus destination. */
  onCloseAutoFocus?: (event: Event) => void;
};

/**
 * The panel, rendered in place right after its trigger: it follows the trigger
 * in the tab order and inherits theme and stacking. Opening never moves focus.
 * Closing returns focus to the trigger only if the panel held it and no outside
 * pointer interaction closed it; Escape does so at once, other closes after the
 * exit transition.
 */
export function PopoverContent({
  label,
  children,
  className,
  align = "center",
  hitTestableExit = false,
  onCloseAutoFocus,
}: PopoverContentProps) {
  const { open, triggerRef } = usePopover("PopoverContent");
  // Radix presence mounts the content a render after `open` turns true, so the
  // effects below also run when the node mounts.
  const contentRef = useRef<HTMLDivElement>(null);
  const [mountedContent, setMountedContent] = useState<HTMLDivElement | null>(
    null,
  );
  const setContent = useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;
    setMountedContent(node);
  }, []);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);
  const interactedOutsideRef = useRef(false);

  // Closed content leaves the tab order and the accessibility tree at once, also
  // while its exit transition runs. Note whether it held focus first, before
  // inert drops that focus; a reopen during the exit keeps that note while focus
  // still sits on <body>. An outside pointer interaction cancels it.
  useLayoutEffect(() => {
    const content = contentRef.current;
    const surface = surfaceRef.current;
    if (!content || !surface) return;
    const { activeElement, body } = content.ownerDocument;
    if (open) {
      interactedOutsideRef.current = false;
      // Enter from the closed look: flush styles once, then mark the content
      // entered, so the transition starts in this frame in every browser.
      if (!content.hasAttribute("data-entered")) {
        void getComputedStyle(content).opacity;
        content.setAttribute("data-entered", "");
      }
    } else {
      restoreFocusRef.current =
        !interactedOutsideRef.current &&
        (content.contains(activeElement) ||
          (restoreFocusRef.current && activeElement === body));
      // The container itself is not inert (its area may stay hit-testable).
      if (activeElement === content) content.blur();
    }
    surface.inert = !open;
    if (open) content.removeAttribute("aria-hidden");
    else content.setAttribute("aria-hidden", "true");
  }, [open, mountedContent]);

  // A closing panel either passes pointer hits through - Radix's positioning
  // wrapper included - or, for a hover consumer, keeps its area hit-testable.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const passThrough = !open && !hitTestableExit;
    content.style.pointerEvents = passThrough ? "none" : "";
    const wrapper = content.parentElement;
    if (wrapper?.hasAttribute("data-radix-popper-content-wrapper"))
      wrapper.style.pointerEvents = passThrough ? "none" : "";
  }, [open, hitTestableExit, mountedContent]);

  const holdsFocus = () =>
    !!contentRef.current?.contains(document.activeElement);

  return (
    <PopoverPrimitive.Content
      ref={setContent}
      aria-label={label}
      side="bottom"
      align={align}
      onOpenAutoFocus={(event) => event.preventDefault()}
      onInteractOutside={(event) => {
        if (!triggerRef.current?.contains(event.target as Node))
          interactedOutsideRef.current = true;
      }}
      onEscapeKeyDown={() => {
        if (holdsFocus()) triggerRef.current?.focus({ preventScroll: true });
      }}
      onCloseAutoFocus={(event) => {
        onCloseAutoFocus?.(event);
        // An outside pointer interaction, also one after the close began,
        // leaves focus where that interaction put it.
        const restore =
          restoreFocusRef.current &&
          !interactedOutsideRef.current &&
          !event.defaultPrevented;
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
      className="z-raised outline-none transition-[opacity,translate] duration-base ease-flow not-data-entered:translate-y-2 not-data-entered:opacity-0 data-[side=bottom]:pt-1.5 data-[side=top]:pb-1.5 data-[state=closed]:translate-y-2 data-[state=closed]:opacity-0 data-[state=closed]:animate-presence-hold"
    >
      <div
        ref={surfaceRef}
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
