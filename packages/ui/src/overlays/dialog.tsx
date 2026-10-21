"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useRef, type RefObject } from "react";

import { cn } from "../utils/cn";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Extra classes for the panel. */
  className?: string;
  id?: string;
  labelledBy?: string;
  describedBy?: string;
  /** `custom` fills the viewport; the consumer supplies its panel look/layout. */
  layout?: "panel" | "custom";
  /** Prefer this target to the control focused when the dialog opened. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** Visible focus target when the opener was removed, hidden or disabled. */
  fallbackFocusRef?: RefObject<HTMLElement | null>;
  /** Prevent default to let navigation choose its own focus destination. */
  onCloseAutoFocus?: (event: Event) => void;
};

function canRestoreFocus(
  element: HTMLElement | null | undefined,
): element is HTMLElement {
  return (
    !!element?.isConnected &&
    element !== element.ownerDocument.body &&
    !element.matches(":disabled, [aria-disabled='true']") &&
    !element.closest("[inert], [hidden], [aria-hidden='true']") &&
    element.getClientRects().length > 0 &&
    getComputedStyle(element).visibility !== "hidden"
  );
}

/** Controlled modal. Radix owns presence, focus containment, dismissal and scroll locking. */
export function Dialog({
  open,
  onClose,
  children,
  className,
  id,
  labelledBy,
  describedBy,
  layout = "panel",
  returnFocusRef,
  fallbackFocusRef,
  onCloseAutoFocus,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && open) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          aria-hidden
          className="fixed inset-0 z-overlay bg-black/45 backdrop-blur-sm motion-safe:data-[state=open]:animate-fade motion-safe:data-[state=closed]:animate-fade-out"
          style={open ? undefined : { pointerEvents: "none" }}
        />
        <DialogPrimitive.Content
          ref={panelRef}
          id={id}
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          aria-hidden={!open || undefined}
          inert={!open}
          style={open ? undefined : { pointerEvents: "none" }}
          onOpenAutoFocus={() => {
            openerRef.current =
              document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
          }}
          onCloseAutoFocus={(event) => {
            onCloseAutoFocus?.(event);
            if (event.defaultPrevented) return;
            event.preventDefault();
            // Presence may have been interrupted by a controlled reopen. An old
            // unmount callback must not steal focus from connected, open content.
            // A real unmount while `open` is still true has a null/disconnected ref.
            if (open && panelRef.current?.isConnected) return;
            const target = [
              returnFocusRef?.current,
              openerRef.current,
              fallbackFocusRef?.current,
            ].find(canRestoreFocus);
            target?.focus({ preventScroll: true });
          }}
          className={cn(
            "fixed z-overlay outline-none",
            layout === "panel"
              ? "inset-x-4 top-1/2 mx-auto -translate-y-1/2 max-w-lg rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-7 motion-safe:data-[state=open]:animate-rise motion-safe:data-[state=closed]:animate-fall"
              : "inset-0",
            className,
          )}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
