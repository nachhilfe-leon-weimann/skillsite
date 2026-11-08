"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";

import { Eyebrow } from "../typography/eyebrow";
import { cn } from "../utils/cn";

export type SelectOption<T extends string | number> = {
  value: T;
  label: string;
  /** Optional second line shown under the label in the open panel. */
  hint?: string;
};

type SelectTone = "default" | "inverse";

type SelectProps<T extends string | number> = {
  value: T;
  options: SelectOption<T>[];
  /**
   * Called once per committed change with the option's own value. A `value`
   * that matches no option shows (and checks) the first option, but choosing
   * that option is then no change and does not call `onChange`.
   */
  onChange: (value: T) => void;
  /** Accessible name of the trigger and the list; shown as the eyebrow unless `hideLabel`. */
  label: string;
  /** Keep the label for assistive technology only. */
  hideLabel?: boolean;
  /** Leading icon, rendered in a small chip to echo neighbouring info rows. */
  icon?: React.ReactNode;
  tone?: SelectTone;
  disabled?: boolean;
  className?: string;
};

const tones: Record<
  SelectTone,
  {
    trigger: string;
    chip: string;
    eyebrow: "muted" | "inverse-accent";
    value: string;
    chevron: string;
    panel: string;
    option: string;
    optionActive: string;
    optionSelected: string;
    hint: string;
  }
> = {
  default: {
    trigger: "border-line bg-bg text-ink hover:bg-surface-2",
    chip: "bg-surface-2 text-coral",
    eyebrow: "muted",
    value: "text-ink",
    chevron: "text-ink-soft",
    panel: "border-line bg-surface shadow-card",
    option: "text-ink-soft hover:bg-surface-2",
    optionActive: "data-highlighted:bg-surface-2",
    optionSelected: "font-semibold text-ink",
    hint: "text-ink-soft",
  },
  inverse: {
    trigger:
      "border-overlay-12 bg-overlay-6 text-on-navy hover:border-overlay-22 hover:bg-overlay-10",
    chip: "bg-overlay-8 text-accent-blue",
    eyebrow: "inverse-accent",
    value: "text-on-navy",
    chevron: "text-on-navy-soft",
    panel: "border-overlay-14 bg-inverse-raised shadow-popover-inverse",
    option: "text-on-navy-soft hover:bg-overlay-8",
    optionActive: "data-highlighted:bg-overlay-8",
    optionSelected: "font-semibold text-on-navy",
    hint: "text-on-navy-muted",
  },
};

/**
 * Radix keys items by non-empty strings. Tagging each value with its type keeps
 * `1` and `"1"` apart and makes `""` a valid key; values are mapped back through
 * the options, never parsed from the key.
 */
function optionKey(value: string | number) {
  return `${typeof value === "number" ? "n" : "s"}:${value}`;
}

const OPTION = "[role='option']";
const MODIFIER_KEYS = new Set(["Alt", "Control", "Meta", "Shift"]);

/**
 * Focus fell away from the trigger rather than moving to another control: to
 * the page, or to a container that holds the trigger and is not in the tab
 * order (a tabbable one is a stop the visitor chose). Focus that rests on the
 * page when the list unmounts is moved by a modal Dialog's focus trap onto the
 * dialog's panel (tabIndex -1).
 */
function focusFellFrom(trigger: HTMLElement, active: Element | null) {
  return (
    !active ||
    active === trigger.ownerDocument.body ||
    (active !== trigger &&
      active.contains(trigger) &&
      !(active instanceof HTMLElement && active.tabIndex >= 0))
  );
}

/**
 * What a press may focus: its nearest focusable element, as most browsers pick
 * it. Safari focuses no button or link on a click; there such a press drops
 * focus to the page, or in a modal Dialog to the dialog's panel, and
 * onCloseAutoFocus returns it to the trigger.
 */
const PRESS_FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  "iframe",
  "summary",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]",
].join(",");

const MODAL = "[aria-modal='true']";

/**
 * While a closed list leaves, its focus scope still pauses a modal Dialog's
 * focus trap: Radix resumes it only once the list unmounts. Hold focus in the
 * dialog that holds the trigger meanwhile, as its trap would: focus that lands
 * outside returns to the dialog's last focused element. Never fight another
 * modal that takes focus (a dialog opened on top): stand down for good. Does
 * nothing once the dialog itself closes (it turns inert). Returns the release,
 * or nothing outside a modal Dialog.
 */
function holdFocusInModal(trigger: HTMLElement) {
  const modal = trigger.closest<HTMLElement>(MODAL);
  if (!modal) return undefined;
  const doc = trigger.ownerDocument;
  const active = doc.activeElement;
  let last: HTMLElement =
    active instanceof HTMLElement && modal.contains(active) ? active : trigger;
  const hold = (event: FocusEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (modal.contains(target)) {
      last = target;
      return;
    }
    if (target.closest(MODAL)) {
      release();
      return;
    }
    if (!modal.isConnected || modal.closest("[inert]")) return;
    last.focus({ preventScroll: true });
  };
  const release = () => doc.removeEventListener("focusin", hold, true);
  doc.addEventListener("focusin", hold, true);
  return release;
}

/**
 * Select on Radix: a combobox trigger with a rotating chevron and a listbox
 * panel that slides and scales in below it. Radix owns the keyboard (arrows,
 * Home/End, typeahead, Enter/Space, Escape), focus, outside interaction and the
 * panel's presence; the panel renders in place, so it inherits theme and
 * stacking (also inside a Dialog). Tones let it sit on dark surfaces.
 */
export function Select<T extends string | number>({
  value,
  options,
  onChange,
  label,
  hideLabel = false,
  icon,
  tone = "default",
  disabled,
  className,
}: SelectProps<T>) {
  const t = tones[tone];
  const hintId = useId();

  const [open, setOpen] = useState(false);
  // While the pointer is over the panel, only the row under it shows a
  // background (:hover). Outside, the keyboard's active row keeps one.
  const [hovering, setHovering] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [mountedContent, setMountedContent] = useState<HTMLDivElement | null>(
    null,
  );
  const setContent = useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;
    setMountedContent(node);
  }, []);
  // A press began on the open trigger: its click closes the panel, as before,
  // and must not reopen it.
  const pressClosedRef = useRef(false);
  // Enter on a row commits and refocuses the trigger during the keydown; the
  // browser then activates the trigger with a click, which must not reopen it.
  const enterCommitRef = useRef(false);

  // An unknown value shows the first option, as before.
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selected = options[selectedIndex];

  // Enter from the closed look on the frame the panel mounts. Radix places the
  // panel (and may flip it above the trigger) before that frame's animation
  // callbacks, so the entrance starts there from the placed side. Until then
  // nothing transitions. A reopen during the exit reverses the running exit.
  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content || !open || content.hasAttribute("data-entered")) return;
    const frame = requestAnimationFrame(() => {
      void getComputedStyle(content).opacity;
      content.setAttribute("data-entered", "");
    });
    return () => cancelAnimationFrame(frame);
  }, [open, mountedContent]);

  // Focus follows the state at once, also while the exit transition keeps the
  // closed panel mounted (inert). Runs after Radix has released its focus trap.
  const wasOpenRef = useRef(false);
  // Releases the focus hold of a leaving list (see holdFocusInModal).
  const releaseHoldRef = useRef<(() => void) | undefined>(undefined);
  const releaseHold = useCallback(() => {
    releaseHoldRef.current?.();
    releaseHoldRef.current = undefined;
  }, []);
  useEffect(() => releaseHold, [releaseHold]);
  useEffect(() => {
    const content = contentRef.current;
    const active = document.activeElement;
    releaseHold();
    if (!open && wasOpenRef.current) {
      const trigger = triggerRef.current;
      // Every way to close leaves focus in the list. focusFellFrom is a guard:
      // its container clause has no path here, as the open list's focus scope
      // keeps focus inside it; it matters in onCloseAutoFocus.
      if (
        trigger?.isConnected &&
        (focusFellFrom(trigger, active) || content?.contains(active))
      )
        trigger.focus({ preventScroll: true });
      // Until the list's close autofocus, which runs at its unmount.
      if (trigger && content?.isConnected)
        releaseHoldRef.current = holdFocusInModal(trigger);
    } else if (open && !wasOpenRef.current && content?.isConnected) {
      // Reopened during the exit: Radix focuses the selected row only on mount.
      if (!content.contains(active)) {
        const row =
          content.querySelector<HTMLElement>(`${OPTION}[data-state=checked]`) ??
          content.querySelector<HTMLElement>(OPTION);
        row?.focus({ preventScroll: true });
      }
    }
    wasOpenRef.current = open;
  }, [open, releaseHold]);

  // Radix focuses rows and the trigger programmatically around pointer
  // interactions, so Chrome would show focus rings on them after a click or a
  // tap. As before, rings show only after the keyboard was used.
  const setPointerModality = (pointer: boolean) =>
    rootRef.current?.toggleAttribute("data-select-pointer", pointer);

  const changeOpen = (next: boolean) => {
    // A press dragged off the open trigger left no click to consume this.
    pressClosedRef.current = false;
    if (next) setHovering(false);
    setOpen(next);
  };

  return (
    <div
      ref={rootRef}
      className={cn("relative", className)}
      onPointerDownCapture={() => setPointerModality(true)}
      onKeyDownCapture={(event) => {
        if (!MODIFIER_KEYS.has(event.key)) setPointerModality(false);
      }}
      // Tab from elsewhere onto the trigger: the browser decides again.
      onFocusCapture={(event) => {
        const from = event.relatedTarget;
        const target: EventTarget = event.target;
        if (
          target === triggerRef.current &&
          from instanceof Node &&
          !rootRef.current?.contains(from)
        )
          setPointerModality(false);
      }}
    >
      <SelectPrimitive.Root
        open={open}
        onOpenChange={changeOpen}
        value={selected ? optionKey(selected.value) : ""}
        onValueChange={(key) => {
          const option = options.find(
            (candidate) => optionKey(candidate.value) === key,
          );
          if (option) onChange(option.value);
        }}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          ref={triggerRef}
          aria-label={label}
          // Radix makes the page, the trigger included, ignore the pointer while
          // the panel is open or leaving. The trigger stays hit-testable, as
          // before: it keeps its hover look, a click closes the open panel and a
          // click during the exit reopens it. As before, the click decides: a
          // held press, or one dragged off and released elsewhere, opens or
          // closes nothing. Radix's press and click handlers are skipped.
          onPointerDown={(event) => {
            pressClosedRef.current = open;
            // Skip Radix's handler, which keeps an open panel open and opens a
            // mouse press at once.
            if (open || event.pointerType === "mouse") event.preventDefault();
            // That also skips the press's own focus: give it, as before. While
            // the panel is open, Radix keeps focus in it.
            if (!open && event.pointerType === "mouse")
              event.currentTarget.focus({ preventScroll: true });
          }}
          onClick={(event) => {
            const close = pressClosedRef.current;
            const suppress = close || enterCommitRef.current;
            pressClosedRef.current = false;
            enterCommitRef.current = false;
            // Always skip Radix's handler: it would reopen the panel, and its
            // open arms a one-off release handler that closes the panel when a
            // later press on the trigger or a row is dragged off it.
            event.preventDefault();
            if (close) changeOpen(false);
            else if (!suppress && !open) {
              event.currentTarget.focus();
              changeOpen(true);
            }
          }}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors in-data-[select-pointer]:outline-none",
            t.trigger,
            disabled ? "pointer-events-none opacity-60" : "pointer-events-auto",
          )}
        >
          {icon ? (
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                t.chip,
              )}
            >
              {icon}
            </span>
          ) : null}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <Eyebrow dot={false} tone={t.eyebrow} aria-hidden>
              {hideLabel ? null : label}
            </Eyebrow>
            <span className={cn("truncate text-small font-semibold", t.value)}>
              {selected?.label ?? ""}
            </span>
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 transition-transform duration-quick",
              t.chevron,
              open && "rotate-180",
            )}
          />
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Content
          ref={setContent}
          position="popper"
          side="bottom"
          align="start"
          sideOffset={8}
          aria-label={label}
          // Closed content leaves the tab order, the accessibility tree and
          // pointer hits at once, also while its exit transition runs.
          inert={!open}
          aria-hidden={open ? undefined : true}
          style={open ? undefined : { pointerEvents: "none" }}
          onPointerDownOutside={(event) => {
            const trigger = triggerRef.current;
            const target = event.target;
            if (!trigger || !(target instanceof Node)) return;
            // The trigger's own handlers decide (see above).
            if (trigger.contains(target)) {
              event.preventDefault();
              return;
            }
            // The press closes the list, and the close returns focus to the
            // trigger at once. A press that focuses no other control would
            // then drop focus to the page for the whole exit, where no focus
            // trap catches it. Skip the press's focus change, as a native select
            // keeps focus when its list is dismissed. A press on another
            // control is left to the browser, which focuses that control
            // (Safari not for a button or link, see PRESS_FOCUSABLE).
            const control =
              target instanceof Element
                ? target.closest(PRESS_FOCUSABLE)
                : null;
            if (focusFellFrom(trigger, control))
              event.detail.originalEvent.preventDefault();
          }}
          onCloseAutoFocus={(event) => {
            // The list unmounted: Radix resumes the dialog's trap now.
            releaseHold();
            // Focus moved to another control when the panel closed; do not
            // pull it back now. Focus that fell away returns to the trigger.
            event.preventDefault();
            const trigger = triggerRef.current;
            if (
              trigger?.isConnected &&
              focusFellFrom(trigger, document.activeElement)
            )
              trigger.focus({ preventScroll: true });
          }}
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => setHovering(false)}
          // Reversible transitions, as before: in over duration-base, out over
          // duration-quick. presence-hold-quick keeps closing content mounted
          // for the exit; on a top-side flip the panel moves the other way.
          className={cn(
            "z-dropdown max-h-(--radix-select-content-available-height) w-(--radix-select-trigger-width) rounded-xl border",
            "transition-[opacity,translate,scale] ease-flow data-[side=bottom]:origin-top data-[side=top]:origin-bottom",
            "translate-y-0 scale-100 opacity-100 duration-base",
            "not-data-entered:-translate-y-1 not-data-entered:scale-[0.97] not-data-entered:opacity-0 not-data-entered:transition-none data-[side=top]:not-data-entered:translate-y-1",
            "data-[state=closed]:-translate-y-1 data-[state=closed]:scale-[0.97] data-[state=closed]:opacity-0 data-[state=closed]:duration-quick data-[state=closed]:animate-presence-hold-quick data-[side=top]:data-[state=closed]:translate-y-1",
            t.panel,
          )}
        >
          <SelectPrimitive.Viewport className="p-1.5">
            {options.map((option, index) => {
              const isSelected = index === selectedIndex;
              const hint = option.hint ? `${hintId}-${index}` : undefined;
              return (
                <SelectPrimitive.Item
                  key={optionKey(option.value)}
                  value={optionKey(option.value)}
                  textValue={option.label}
                  aria-describedby={hint}
                  // As before, the pointer only hovers rows: focus (the ring and
                  // the Enter target) stays with the keyboard. Skip Radix's
                  // focus on hover and its refocus when the pointer leaves.
                  onPointerMove={(event) => event.preventDefault()}
                  onPointerLeave={(event) => event.preventDefault()}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    enterCommitRef.current = true;
                    setTimeout(() => {
                      enterCommitRef.current = false;
                    });
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-small font-medium transition-colors duration-0 in-data-[select-pointer]:outline-none",
                    t.option,
                    !hovering && t.optionActive,
                    isSelected && t.optionSelected,
                  )}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">
                      <SelectPrimitive.ItemText>
                        {option.label}
                      </SelectPrimitive.ItemText>
                    </span>
                    {option.hint ? (
                      <span id={hint} className={cn("text-caption", t.hint)}>
                        {option.hint}
                      </span>
                    ) : null}
                  </span>
                  <SelectPrimitive.ItemIndicator asChild>
                    <Check className="size-4 shrink-0 text-coral" aria-hidden />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              );
            })}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Root>
    </div>
  );
}
