# AGENT.md — HamOwj Coding-Agent Harness

Version 1.0 · distilled from `HamOwj_Visual_Guide.pdf` (26 pages) plus product-owner decisions.

Every UI change in this repo MUST conform to this file. If the guide and this file ever disagree, the guide wins and this file must be updated. If a rule cannot be satisfied, say so in the report — never silently skip it.

---

## 1. Product & language baseline

- Product: **HamOwj (هم‌اوج)** — professional platform for gym/club group management: owner, branch manager, coach (مربی), member (عضو). Personal-fitness-journey marketing is NOT our voice; confident, anticipatory, precise, mindful.
- Brand promise: a complete platform for in-gym and branch/reporting management, backed by spirit and a supporting team.
- **RTL-first**: the document is `lang="fa" dir="rtl"`. Every new route must be correct under RTL before merge.
- Localized names: «هم‌اوج» (Persian) / **HamOwj** (Latin). No marketing slogans, ever, inside admin surfaces.

## 2. Locked product decisions (owner-confirmed — do not re-litigate)

| Topic | Decision |
| --- | --- |
| Digits | **Persian digits everywhere** (fa-IR), including inside text/number inputs; normalize on submit. User codes (M-1042), UUIDs, emails, phone numbers, API keys stay Latin, wrapped in `<bdi>` or `dir="auto"` |
| Currency | **Toman (تومان)** — always written next to the amount, e.g. «۲۴۵٬۰۰۰ تومان». A bare number is never money |
| Date/time | Script follows page language: Persian → Jalali («۱۴ آبان ۱۴۰۴»), Latin → Gregorian. Respect the user's timezone via `Intl` |
| Persian punctuation | Use « ، ؛ ؟» and «…» guillemets; Persian «ی» and «ک»; sentences rearranged for natural Persian flow, not translated slabs |
| Typography | **Vazirmatn (400/500/700/800) + Inter** via `next/font`, `display: swap`; fallback chain `Vazirmatn, Inter, system-ui, sans-serif`. IRANSansX stays on disk but sits outside the rendering chain |
| Dark mode | Wired through the `dark` class; default theme light; the dark token table below is a contract |
| Proposed scales | Adopted as binding: spacing scale, radius scale, breakpoints, type scale, minimum logo sizes |
| Wordmark as lockup | Mark **plus** the HamOwj wordmark lockup placed in the sidebar, mobile bar and login screen, at ≥24px mark size |

## 3. Colour tokens (contract — copy the hexes exactly)

Tokens live in `app/globals.css`; the shadcn alias layer is the only indirection. Never hard-code a palette hex inside a component, except logo artwork (`#352820` / `#F6F3ED`).

| Token | Light | Dark | Rule |
| --- | --- | --- | --- |
| `--background` | `#F6F3ED` Decorator White | `#1B1A1B` Eerie Black | page base |
| `--card` / `--popover` (surface) | `#FBF9F5` | `#252324` | cards, menus, dialogs |
| `--foreground` (text) | `#1B1A1B` | `#F6F3ED` | DOM text is exactly this |
| `--muted-foreground` | `#463F41` Ewa | `#9FA9A8` | never `#788584` for sustained body text |
| `--border` (decorative) | `#DDD7CB` | `#3A3638` | cards, dividers |
| `--input` (control border) | `#788584` Portsmouth | `#788584` | borders of inputs/controls only |
| `--primary` (action) | `#FB9A3C` Chat Orange | `#FB9A3C` | main action, core CTA, selection highlight, step labels |
| `--primary-foreground` (on-action) | `#1B1A1B` | `#1B1A1B` | text/icons sitting on Chat Orange |
| `--ring` (focus) | `#1B1A1B` | `#F6F3ED` | focus rings; feeds `--brand-focus` |
| `--success` | `#2E7D4F` | `#6FC08F` | success text/icons; solid-token semantics |
| `--success-foreground` | `#F6F3ED` | `#1B1A1B` | on solid success fills |
| `--warning` / fg | `#8A5A00` / `#F6F3ED` | `#E0B04F` / `#1B1A1B` | warning fills |
| `--destructive` (error) / fg | `#B3392F` / `#F6F3ED` | `#F08A80` / `#1B1A1B` | error fills; use `text-destructive-foreground`, never hard-coded `text-white` |
| `--info` / fg | `#3A6B8C` / `#F6F3ED` | `#8DB8D6` / `#1B1A1B` | info fills |
| `--disabled` | `#B9B5AD` | `#5A5557` | disabled text/icons |

Supporting palette roles (no token): `#788584` Portsmouth = icons, control borders, grey-metal parts; `#A96D20` Buckthorn Brown = secondary accent, expense highlights, ornament accents; Ewa `#463F41` = dark muted body; `#352820` = dark logo variant.

Approximate usage budget: 60% base/neutral surface, ~22% text/neutral, ~10% orange, 3–5% Portsmouth, ≤3% Buckthorn Brown. If a surface starts feeling orange-heavy, cut back to the neutral.

**Hard colour rules**

- Chat Orange is NEVER text on Decorator White; orange text decoration only on Eerie/Ewa.
- Buckthorn Brown never as text on Decorator White — on Eerie Black, or as decoration only.
- Dark muted text is `#9FA9A8`, never Portsmouth.
- Error-filled surfaces carry `text-destructive-foreground` (ivory in light, ink in dark).
- Gradients or neon colors outside the approved palette are banned (substituting tokens wholesale loses brand consistency).

## 4. Typography

| Slot | Spec |
| --- | --- |
| Display | 40/52 · 800 — page title |
| H1 | 32/44 · 800 — section title |
| H2 | 24/36 · 700 — subsection title |
| H3 | 20/32 · 700 — card title |
| Body | 16/29 · 400 — main text |
| Label · helper | 14/24 · 500 |
| Caption | 12/20 · 400 — never below 12px |
| Metric | 32/40 · 800 · `tabular-nums` — dashboards, financial numbers |

Rules:

- Line-height 1.65 general, ≥1.8 for paragraphs.
- Inter for Latin text (product names, brand captions, keys/UUIDs, numerals); Vazirmatn otherwise. `font-variant-numeric: tabular-nums` for sports/financial numbers.
- Line length 45–75 characters. Persian word-breaks don't break Latin URLs.
- Never carry hierarchy with colour or bold mid-paragraph; never fake jargon emphasis.

## 5. Layout, spacing, geometry

- Spacing scale only: `4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 · 64` px. Anything else needs a documented exception.
- Breakpoints: mobile ≤639 / tablet 640–1023 / desktop 1024–1279 / wide ≥1280 (max-centred layout).
- Content grids collapse to single-column stacks on smaller screens; navigation switches sidebar → bottom bar at ≤639px.
- Radius scale: small items (badges) **6px**, controls (inputs/buttons) **10px**, cards **14px**, chips/pills **999px**. With `--radius: 0.875rem`: `rounded-lg` = cards (14), `rounded-sm` = controls (10), chips = `rounded-full`/`999px`.
- Touch targets ≥44×44 primary controls on mobile/desktop; 36px only for small secondary buttons inside dialogs, with comfortable whitespace.
- Elevation: level 0 page (no shadow); card = surface + 1px border, no heavy shadow; menu/dialog = soft bounded shadow. Card borders use `--brand-divider`, shadows from `--shadow-card` / `--shadow-elevated`.
- Icons (Lucide): stroke 1.75, base 24×24, inner radius 2, sizes 16/20/24/32, `currentColor` only, one icon per icon-slot, decorative icons `aria-hidden`.

## 6. Interactive states (every control, light and dark)

| State | Rule |
| --- | --- |
| Hover | only a background shade shift — slightly darker in light, slightly lighter in dark; never reposition or enlarge |
| Pressed | inner shadow, 1px indent or 1px downward shift |
| `focus-visible` | 3px halo + 2px offset from the focus token (`.brand-focus-ring` or shadcn ring). Never remove focus visibility |
| Selected | light tint background + orange or amber edge |
| Disabled | `--disabled` text/icons; explain WHY it is disabled (e.g. «ثبت تخصیص» disabled until validation passes); contrast may be relaxed only for genuinely unavailable controls |
| Loading | skeleton for expected ≥500ms; spinner only for resubmission after a bulk action |
| Irreversible action | confirm dialog naming the object and consequence («حذف شعبه «مرکزی»؟»); first button focused, `Esc` armed, initial focus on the safe button «انصراف» |

Phantom data is forbidden: skeleton → API data or honest nothing. Empty = «هنوز…». Error = «تلاش دوباره» + support path. Bulk results replace skeletons atomically — never partial or phantom rows.

## 7. Forms

- Above-label (never placeholder-as-label), `autocomplete` for name/email/phone; inline hints with `aria-describedby`; errors name the field and the fix.
- After submit, focus moves to the first invalid field; a top summary is acceptable in addition.
- Never auto-submit; batched multi-field changes need explicit submit («اعمال تغییرات» for apply-vs-revert).
- Two-stage loading in long forms: filter before data; keyboard navigation is first-class.

## 8. Copy rules (interface language)

- Friendly-you «شما»; honest about constraints; plain, direct, data-first language.
- Actions are verbs; never CRUD jargon: «اعمال تغییرات» for apply, «ثبت تخصیص» for save-assignment, «حذف شعبه» for delete-branch.
- No exclamation marks.
- Dialogs: title names the object («حذف شعبه «مرکزی»؟»); body says what will happen; buttons carry concrete verbs, «انصراف» is always the safe abort.
- Persian guillemets «…» for quotes; «…» marks truncated text; Persian «ی» and «ک», never Arabic «ي/ك» — search for both in code review.
- No «OK/باشه»; use «تأیید» for solid irreversible confirmation, «انصراف» for cancel.

## Empty / error / loading states (exact copy)

- Table empty: «هنوز رکوردی ثبت نشده. اگر فیلتری فعال است فیلترها را بازبینی کنید.» + «افزودن عضو» CTA.
- Missing data/cell (no API data): «—» — never a invented value.
- API failure: browser surface must stay usable; non-2xx with HTML body is treated as an opaque failure. Message: «ذخیره‌سازی ناموفق بود. اتصال اینترنت و داده حساس را بررسی کنید.»
- Loading table: skeleton of actual columns; no fake rows.
- Optimistic UI failures: swap in inline error state, don't toast-spam.

## 9. RTL & mixed direction

- Always the logical properties: `text-align: start`, `margin-inline-*`, `padding-inline-*`, `inset-inline-*`, Tailwind `start-*` / `end-*` / `ms-*` / `me-*` / `ps-*` / `pe-*`. Physical `left`/`right`/`pl`/`pr` are allowed only for genuinely physical artifacts (e.g. a magnetic scroll edge).
- All user data (names, emails, phone numbers, codes, amounts, file names) must be inside `<bdi>` or a `dir="auto"`/`dir="ltr"` element — never a hard-coded direction over mixed text. `unicode-bidi: isolate` in CSS as a fallback.
- Under RTL, logical `start` = physical `right`. Verify mixed-direction lines (Persian sentence containing an email or ID) bend neither line nor chars.

## 10. Motion

- Micro-interactions 120–200ms; state transitions 150ms; page entrance at most once per session; loading uses skeletons, progress bars, or no animation.
- `prefers-reduced-motion: reduce` disables all of it (already configured in `globals.css`).

## 11. Accessibility (WCAG 2.2 AA — must pass)

- Contrast ≥4.5 normal text, ≥3 large text/graphics/UI components; see §3 for disabled colors.
- All visible mouse functionality reachable by keyboard; `Tab` order follows visual RTL order; ordering = focus never lost.
- Icon-only buttons need `aria-label` describing the object («حذف عضو م-۱۰۴۲», not «حذف»).
- Live regions (`aria-live`) announce toasts, field errors, async success/failure.
- Dialogs trap focus, close inside; `Esc` armed; return focus to the trigger on dismiss.
- Decorative visuals (muscle SVG, body-map, charts) need text equivalents and instructions for text-only reading.

## 12. Tables, navigation, dashboards

- Numeric columns use `tabular-nums` with stable ordering; RTL reading stays name-first from the start edge.
- Status columns reflect backend data, never client-faked labels; actions name their exact object; fresh rows stream in from the live source.
- Row actions in a dropdown on mobile; page actions in the header.
- Bulk operations go through backend queues with live progress + result, NOT client-side batch loops; destructive bulk actions need a confirm dialog that lists the scope.
- Each primary page reads in 10 seconds: (1) where am I, (2) what matters, (3) what's next.
- Section/chat toolbars: search-specific filters, not generic-undefined; state kept in URL where useful.
- Metric-card rules: title + unit + API-backed value; sub-caption context («۳۰ روز گذشته، فعال در شعبه مرکزی»); «صفر = صفر» semantics; HelpTooltip is optional on hover/focus; a tooltip is never a data source.

## 13. Admin-surface ethics

- No marketing copy, invented numbers, or testimonials. Real API data only; if the backend lacks something, show the data-entry state or an explicit «پیش‌نمایش — نمایشی» suffix instead of inventing.
- Never copy metric values from the guide's own examples — they are placeholders. «اتصال سرویس» badges only after a real connection check.
- Progress/coach-encouragement phrasing («با هم به این هفته سه جلسه ثابت شده», «از هدف خود تعسست بذار») never appears on admin surfaces; admin copy stays neutral and factual.

## 14. Verification — must pass before delivering a change

```bash
npm run lint          # eslint
npx tsc --noEmit      # typecheck
npm run build         # next build
```

- Verify tokens vs §3, spacing vs §5, typography vs §4, states vs §6, RTL/mixed-direction vs §9, and empty/loading/error copy vs §8. Audit every claim before declaring done. Never claim a pass without running the command and seeing it succeed.

## 15. Quick fixes (frequent mistakes)

- Muted text on a muted surface: bump to `--foreground` or increase opacity — never fix readability by switching to Portsmouth in dark mode.
- `text-white` on `--destructive`/`bg-destructive` inside dark mode is unreadable — use token-paired foreground instead.
- `left-0`/`pl-4` sit-ups in RTL authority: rewrite to `start-0`/`ps-4`.
- Hard-coded hex outside the token block → replace with token or `color-mix(...)` derived value.
- Placeholder-marked labels → convert to real labels; placeholder text serves example formatting like «۱۳۹۲/۰۸/۱۴».
- Brand mark on white-on-white surfaces → force the Dark (`#352820`) or Lite (`#F6F3ED`) artwork variant to match its background.
- Chinese/gibberish in copy or comments → always re-write tidily in Persian.

---

*Harness version: 2026-10-29. Source of truth: HamOwj Visual Guide v1.0 (PDF), 26 pages.*
