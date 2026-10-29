# Agents

Read **[AGENT.md](./AGENT.md)** first — it is the full coding-agent harness for this repo (HamOwj design system, tokens, RTL rules, copy rules, verification checklist).

Key rules in one line each:

1. RTL-first Persian UI: `lang="fa" dir="rtl"`; logical CSS properties only; user data in `<bdi>`/`dir="auto"`.
2. Tokens live in `app/globals.css` — never hard-code palette hexes in components; see AGENT.md §3.
3. Fonts: Vazirmatn (fa) + Inter (Latin) via `next/font`.
4. Digits: Persian everywhere; Toman currency always with the unit; Jalali dates in Persian UI.
5. Every interactive control needs hover/pressed/`focus-visible`/selected/disabled states; focus ring 3px + 2px offset — never removed.
6. No phantom data: loading = skeleton, empty = «هنوز…», error = «تلاش دوباره» + support path; API data or honest nothing.
7. WCAG 2.2 AA minimum: contrast, keyboard parity, `aria-label` on icon-only buttons, `aria-live` for toasts/errors.
8. Verify with `npm run lint`, `npx tsc --noEmit`, `npm run build` before claiming done.

Source of truth: `HamOwj_Visual_Guide.pdf` (v1.0) — AGENT.md distills it; the guide wins in a conflict.
