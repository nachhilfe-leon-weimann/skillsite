"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useInView } from "@skillsite/ui/hooks/use-in-view";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Seg = { text: string; cls?: string; ghost?: boolean; brk?: boolean };
type Frame = { before: Seg[]; after: Seg[]; idle: boolean; t: number };
type Phase = "static" | "typing" | "ending";

// Syntax colours, matching the surrounding brand palette on navy.
const KW = "text-coral-light"; // keywords
const FN = "text-accent-blue"; // function names
const STR = "text-syntax-string"; // strings
const CM = "text-on-navy-muted"; // comments
const IND = "  "; // one indent level

// The finished code as coloured segments. Rendered on the server, under reduced
// motion, and as the invisible sizer that fixes the box height (so typing the
// lines in never shifts layout).
const FINAL: Seg[] = [
  { text: "// das Prinzip zuerst\n", cls: CM },
  { text: "function ", cls: KW },
  { text: "verstehen", cls: FN },
  { text: "(stoff) {\n" + IND },
  { text: "if ", cls: KW },
  { text: "(stoff.klickt)" },
  { text: " ", brk: true },
  { text: "return ", cls: KW },
  { text: "'kann ich selbst'", cls: STR },
  { text: ";\n" + IND },
  { text: "return ", cls: KW },
  { text: "nochmal", cls: FN },
  { text: "(stoff, anderswie);\n}" },
];

// Pacing (ms). Tuned for a ~4.5-5s indulgent take - retune here to re-pace.
const CPS = 24; // base per character
const JIT = 22; // random per-character jitter
const TAB = 115; // beat on a tab-complete press
const PAIR = 60; // beat after an auto-closed pair
const NL = 160; // beat on a line break
const SNAP = 34; // completion snaps in
const GHOST_IN = 200; // the AI suggestion appears
const GHOST_THINK = 520; // beat before accepting it
const END_HOLD = 380; // rest before the caret bows out

/**
 * Expands the fixed keystroke script into timed frames. A frame is the document
 * split around the caret (`before` / `after`), so auto-closed brackets can sit
 * ahead of the caret and get "typed over" later - exactly like a real editor.
 * Pure and deterministic apart from typing jitter; reduced motion skips it.
 */
function buildTimeline(): Frame[] {
  let before: Seg[] = [];
  let after: Seg[] = [];
  let t = 0;
  const frames: Frame[] = [];
  const snap = (idle: boolean) =>
    frames.push({ before: before.slice(), after: after.slice(), idle, t });

  const appendChar = (segs: Seg[], ch: string, cls?: string): Seg[] => {
    const last = segs[segs.length - 1];
    if (last && last.cls === cls && !last.ghost && !last.brk)
      return [...segs.slice(0, -1), { ...last, text: last.text + ch }];
    return [...segs, { text: ch, cls }];
  };
  const appendText = (segs: Seg[], text: string, cls?: string): Seg[] => {
    let out = segs;
    for (const ch of text) out = appendChar(out, ch, cls);
    return out;
  };
  const removeTrailing = (segs: Seg[], n: number): Seg[] => {
    const out = segs.slice();
    while (n > 0 && out.length) {
      const last = out[out.length - 1];
      if (!last) break;
      if (last.text.length <= n) {
        n -= last.text.length;
        out.pop();
      } else {
        out[out.length - 1] = { ...last, text: last.text.slice(0, -n) };
        n = 0;
      }
    }
    return out;
  };

  const type = (text: string, cls?: string) => {
    for (const ch of text) {
      t += CPS + Math.random() * JIT;
      before = appendChar(before, ch, cls);
      snap(false);
    }
  };
  // Type a short prefix plain, then Tab snaps it to the full token in colour.
  const tab = (prefix: string, full: string, cls?: string) => {
    type(prefix, undefined);
    t += TAB;
    snap(true);
    before = removeTrailing(before, prefix.length);
    before = [...before, { text: full, cls }];
    t += SNAP;
    snap(false);
  };
  // Auto-close: the closer lands ahead of the caret.
  const pair = (open: string, close: string, cls?: string) => {
    before = [...before, { text: open, cls }];
    after = [{ text: close, cls }, ...after];
    t += PAIR;
    snap(true);
  };
  // Type over the first pending closer.
  const overtype = () => {
    const first = after[0];
    if (!first) return;
    const ch = first.text.charAt(0);
    const rest = first.text.slice(1);
    after = rest
      ? [{ ...first, text: rest }, ...after.slice(1)]
      : after.slice(1);
    t += CPS;
    before = appendChar(before, ch, first.cls);
    snap(false);
  };
  // Enter inside {}: drop the caret to an indented line, brace to its own line.
  const openBlock = (indent: string) => {
    before = appendText(before, "\n" + indent, undefined);
    const first = after[0];
    after =
      first && first.cls === undefined && !first.ghost
        ? [{ ...first, text: "\n" + first.text }, ...after.slice(1)]
        : [{ text: "\n" }, ...after];
    t += NL;
    snap(true);
  };
  const newline = (indent: string) => {
    t += CPS;
    before = appendText(before, "\n" + indent, undefined);
    snap(false);
    t += NL;
    snap(true);
  };
  // A space on desktop; on mobile it becomes a line break + continuation indent
  // so the long `if` line wraps `return ...` down instead of overflowing.
  const softBreak = () => {
    t += CPS;
    before = [...before, { text: " ", brk: true }];
    snap(false);
  };
  const pause = (ms: number) => {
    t += ms;
    snap(true);
  };
  // Copilot-style suggestion: appears muted, then Tab accepts and recolours it.
  const ghost = (segs: Seg[]) => {
    before = [...before, ...segs.map((s) => ({ ...s, ghost: true }))];
    t += GHOST_IN;
    snap(true);
  };
  const acceptGhost = () => {
    before = before.map((s) => (s.ghost ? { ...s, ghost: false } : s));
    t += SNAP;
    snap(false);
  };
  const caretToEnd = () => {
    before = [...before, ...after];
    after = [];
    t += CPS;
    snap(true);
  };

  // --- the script ---------------------------------------------------------
  type("// das Prinzip zuerst", CM);
  newline("");
  tab("func", "function ", KW);
  type("verstehen", FN);
  pair("(", ")");
  tab("sto", "stoff");
  overtype();
  type(" ");
  pair("{", "}");
  openBlock(IND);
  type("if ", KW);
  pair("(", ")");
  tab("sto", "stoff");
  type(".");
  tab("klic", "klickt");
  overtype();
  softBreak();
  type("return ", KW);
  pair("'", "'", STR);
  type("kann ich selbst", STR);
  overtype();
  type(";");
  newline(IND);
  ghost([
    { text: "return ", cls: KW },
    { text: "nochmal", cls: FN },
    { text: "(stoff, anderswie);" },
  ]);
  pause(GHOST_THINK);
  acceptGhost();
  pause(END_HOLD);
  caretToEnd();

  return frames;
}

function renderSegs(segs: Seg[]) {
  return segs.map((s, i) => {
    // Responsive break: a space on desktop, a wrap + continuation indent on
    // mobile (keeps the long `if` line from overflowing narrow screens).
    if (s.brk)
      return (
        <span key={i}>
          <span className="sm:hidden">{"\n" + IND + IND}</span>
          <span className="hidden sm:inline"> </span>
        </span>
      );
    return (
      <span
        key={i}
        className={s.ghost ? "text-on-navy-muted opacity-70 italic" : s.cls}
      >
        {s.text}
      </span>
    );
  });
}

const STATIC_FRAME: Frame = { before: FINAL, after: [], idle: false, t: 0 };
const PRE_CLASS =
  "col-start-1 row-start-1 m-0 font-mono text-code leading-[1.7] whitespace-pre";

/**
 * The signature moment: the code appears to be written live in an editor -
 * typing with tab-completions, auto-closing brackets, and an AI suggestion for
 * the last line. Triggers once on scroll-in. Falls back to the finished code
 * (no caret) under reduced motion or without JS.
 */
export function CodeTypewriter() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [frame, setFrame] = useState<Frame>(STATIC_FRAME);
  const [phase, setPhase] = useState<Phase>("static");
  const started = useRef(false);

  // Clear to an empty editor before the first client paint (so the finished
  // code never flashes), unless motion is reduced - then keep the final state.
  useIsomorphicLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    setFrame({ before: [], after: [], idle: true, t: 0 });
    setPhase("typing");
  }, []);

  useEffect(() => {
    if (!inView || started.current || prefersReducedMotion()) return;
    started.current = true;

    const frames = buildTimeline();
    let raf = 0;
    let i = 0;
    const start = performance.now();
    const loop = () => {
      const elapsed = performance.now() - start;
      let advanced = false;
      while (i < frames.length && (frames[i]?.t ?? Infinity) <= elapsed) {
        i += 1;
        advanced = true;
      }
      const current = frames[i - 1];
      if (advanced && current) setFrame(current);
      if (i < frames.length) raf = requestAnimationFrame(loop);
      else setPhase("ending");
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="overflow-x-auto rounded-2xl bg-navy p-6 text-on-navy shadow-card"
    >
      <div className="grid">
        {/* Sizer: reserves the full block height so typing never shifts layout. */}
        <pre className={`${PRE_CLASS} invisible`}>{renderSegs(FINAL)}</pre>
        <pre className={PRE_CLASS}>
          {renderSegs(frame.before)}
          {phase !== "static" && (
            <span
              data-idle={phase === "typing" && frame.idle ? "" : undefined}
              data-done={phase === "ending" ? "" : undefined}
              className="ts-caret ml-px inline-block h-[1.05em] w-[0.5ch] translate-y-[0.12em] rounded-caret bg-coral"
            />
          )}
          {renderSegs(frame.after)}
        </pre>
      </div>
    </div>
  );
}
