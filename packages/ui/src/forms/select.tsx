"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

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
    eyebrow: string;
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
    eyebrow: "text-ink-soft",
    value: "text-ink",
    chevron: "text-ink-soft",
    panel: "border-line bg-surface shadow-card",
    option: "text-ink-soft hover:bg-surface-2",
    optionActive: "bg-surface-2",
    optionSelected: "font-semibold text-ink",
    hint: "text-ink-soft",
  },
  inverse: {
    trigger:
      "border-overlay-12 bg-overlay-6 text-on-navy hover:border-overlay-22 hover:bg-overlay-10",
    chip: "bg-overlay-8 text-accent-blue",
    eyebrow: "text-accent-blue",
    value: "text-on-navy",
    chevron: "text-on-navy-soft",
    panel: "border-overlay-14 bg-inverse-raised shadow-popover-inverse",
    option: "text-on-navy-soft hover:bg-overlay-8",
    optionActive: "bg-overlay-8",
    optionSelected: "font-semibold text-on-navy",
    hint: "text-on-navy-muted",
  },
};

/**
 * Accessible custom select: a button trigger with a rotating chevron and an
 * animated popover listbox. Built custom (not a native `<select>`) so the panel
 * and chevron can animate, and so it can sit on dark surfaces via `tone`.
 *
 * Keyboard: arrows / Home / End move the active option, Enter or Space picks it,
 * Escape closes. Clicking outside or tabbing away closes it too.
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
  const listId = useId();

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  // The active/selected option keeps a persistent background only while the
  // pointer is NOT over the list. Once the mouse is inside, the background comes
  // purely from :hover (so it shows only on the row under the cursor); when the
  // pointer leaves again, the active row gets its background back.
  const [hovering, setHovering] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const selectedLabel = options[selectedIndex]?.label ?? "";

  const openMenu = () => {
    if (disabled) return;
    setActiveIndex(selectedIndex);
    setHovering(false);
    setOpen(true);
  };

  const closeMenu = (focusTrigger = false) => {
    setOpen(false);
    if (focusTrigger) triggerRef.current?.focus();
  };

  const focusOption = (index: number) => {
    setActiveIndex(index);
    optionRefs.current[index]?.focus();
  };

  const selectOption = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    closeMenu(true);
  };

  // Move focus onto the active option once the panel becomes interactive.
  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() =>
      optionRefs.current[activeIndex]?.focus(),
    );
    return () => window.cancelAnimationFrame(frame);
    // Runs on open only: activeIndex is set together with `open` in openMenu,
    // and arrow navigation focuses options directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside pointer / Escape while open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeMenu(true);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onBlur={(event) => {
        // Tab-out closes the control. A null relatedTarget (tapping a
        // non-focusable element - e.g. the trigger on iOS, which doesn't focus
        // buttons) is left to the outside-pointer listener and trigger toggle,
        // so onBlur doesn't pre-close and fight the toggle into reopening.
        if (
          event.relatedTarget &&
          !containerRef.current?.contains(event.relatedTarget as Node)
        )
          setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${label}: ${selectedLabel}`}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openMenu();
          }
        }}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
          t.trigger,
          disabled && "pointer-events-none opacity-60",
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
          <span className={cn("text-eyebrow uppercase", t.eyebrow)}>
            {hideLabel ? null : label}
          </span>
          <span className={cn("truncate text-small font-semibold", t.value)}>
            {selectedLabel}
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
      </button>

      <div
        id={listId}
        role="listbox"
        aria-label={label}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        inert={!open}
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => setHovering(false)}
        onKeyDown={(event) => {
          switch (event.key) {
            case "ArrowDown":
              event.preventDefault();
              focusOption(Math.min(options.length - 1, activeIndex + 1));
              break;
            case "ArrowUp":
              event.preventDefault();
              focusOption(Math.max(0, activeIndex - 1));
              break;
            case "Home":
              event.preventDefault();
              focusOption(0);
              break;
            case "End":
              event.preventDefault();
              focusOption(options.length - 1);
              break;
            case "Enter":
            case " ":
              event.preventDefault();
              selectOption(activeIndex);
              break;
            case "Tab":
              setOpen(false);
              break;
          }
        }}
        className={cn(
          "absolute inset-x-0 top-full z-dropdown mt-2 origin-top rounded-xl border p-1.5",
          "transition-[opacity,translate,scale] ease-flow",
          t.panel,
          open
            ? "translate-y-0 scale-100 opacity-100 duration-base"
            : "pointer-events-none -translate-y-1 scale-[0.97] opacity-0 duration-quick",
        )}
      >
        {options.map((option, index) => {
          const isSelected = index === selectedIndex;
          return (
            <button
              key={option.value}
              id={`${listId}-${index}`}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="option"
              aria-selected={isSelected}
              tabIndex={-1}
              onClick={() => selectOption(index)}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-small font-medium transition-colors duration-0",
                t.option,
                !hovering && index === activeIndex && t.optionActive,
                isSelected && t.optionSelected,
              )}
            >
              <span className="flex min-w-0 flex-col">
                <span className="truncate">{option.label}</span>
                {option.hint ? (
                  <span className={cn("text-caption", t.hint)}>
                    {option.hint}
                  </span>
                ) : null}
              </span>
              {isSelected ? (
                <Check className="size-4 shrink-0 text-coral" aria-hidden />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
