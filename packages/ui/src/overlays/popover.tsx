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
   * While closing, keep the panel hit-testable until it has faded out (its links
   * stay inert), so a hover consumer can reopen it when the pointer comes back.
   * Otherwise the closing panel lets every pointer hit through to the page.
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
  const fadedRef = useRef(false);

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
    }
    surface.inert = !open;
    if (open) content.removeAttribute("aria-hidden");
    else content.setAttribute("aria-hidden", "true");
  }, [open, mountedContent]);

  // Only the content takes pointer hits, never Radix's positioning wrapper. A
  // closing panel either passes hits through at once or, for a hover consumer,
  // takes them until it has faded out, as on main, where visibility turns hidden
  // on the frame the opacity transition ends. Here the exit starts between frames
  // (Radix presence reads the style at once), and Chrome may then start the
  // visibility transition a frame after opacity, so the end of the opacity
  // transition decides.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const wrapper = content.parentElement;
    if (wrapper?.hasAttribute("data-radix-popper-content-wrapper"))
      wrapper.style.pointerEvents = "none";
    if (open) fadedRef.current = false;
    const hitTestable = open || (hitTestableExit && !fadedRef.current);
    content.style.pointerEvents = hitTestable ? "auto" : "none";
    if (open || !hitTestable) return;
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== content || event.propertyName !== "opacity") return;
      fadedRef.current = true;
      content.style.pointerEvents = "none";
    };
    content.addEventListener("transitionend", onTransitionEnd);
    return () => content.removeEventListener("transitionend", onTransitionEnd);
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
      // Radix makes the container focusable; a click on the panel's padding
      // would focus it. Like a plain panel, it moves no focus there.
      tabIndex={undefined}
      onInteractOutside={(event) => {
        if (triggerRef.current?.contains(event.target as Node)) return;
        // Also forget a focus return noted earlier, should the panel reopen.
        interactedOutsideRef.current = true;
        restoreFocusRef.current = false;
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
      // smoothly; visibility turns hidden when the exit ends, however short.
      // presence-hold keeps closing content mounted for the full exit duration.
      className="z-raised outline-none transition-[opacity,translate,visibility] duration-base ease-flow not-data-entered:invisible not-data-entered:translate-y-2 not-data-entered:opacity-0 data-[side=bottom]:pt-1.5 data-[side=top]:pb-1.5 data-[state=closed]:invisible data-[state=closed]:translate-y-2 data-[state=closed]:opacity-0 data-[state=closed]:animate-presence-hold"
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
