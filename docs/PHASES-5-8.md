# HamOwj phases 5–8 implementation notes

## Phase 5 — Tenant branding and isolation

- Added opt-in CSS-token themes (`ocean`, `forest`, `sunset`) scoped by a `data-brand` attribute. The default brand remains the existing HamOwj palette.
- Added `TenantBranding` as a constrained UI contract and a helper that accepts only known theme names. Arbitrary CSS, URLs, and tenant-provided color strings are not injected into the page.
- No branding API is called or assumed. The current backend contract supplied by the project does not include tenant branding fields; wire the helper to the real authorized response once available.
- Tenant-aware navigation remains scoped under `/tenants/{tenant}`. This is routing behavior, not an authorization boundary: tenant ownership and access must still be enforced server-side.

## Phase 6 — Persian-first localization

- Added `lib/i18n/messages.ts` with Persian-first shell/feature labels, English equivalents, and a single RTL/LTR direction helper.
- Root HTML remains `lang="fa" dir="rtl"` by default to keep server-rendered markup deterministic. Full English mode requires a locale route/provider and coverage of all visible strings, dates, numbers, validation messages, and API errors; this has intentionally not been faked with a client-only direction flip.
- New strings should be added to both dictionaries. Avoid concatenating translated fragments; keep complete phrases together.

## Phase 7 — QA and release readiness

- `app/globals.css` now includes reduced-motion handling, focus-ring tokens, and tenant-theme smoke-test hooks.
- The logo's theme-dependent SVG fill now uses a CSS custom property instead of reading `resolvedTheme` during render. This removes the server/client color divergence shown in the signup hydration warning without editing signup/signin form code.
- Automated build/lint/type-check could not be run against the submitted archive because it does not include root `package.json`, lockfile, or `tsconfig.json`.

### Manual QA checklist

- [ ] Install using the original repository's lockfile and run its normal lint, type-check, and production build scripts.
- [ ] Verify signup/signin, password reset, and session refresh; auth form files were not edited.
- [ ] Verify light/dark mode on logo, navigation, dialogs, charts, and all focus states.
- [ ] Test keyboard-only navigation and reduced-motion preference.
- [ ] Visit two tenant slugs and confirm all links remain inside the active `/tenants/{tenant}` path.
- [ ] Verify server-side tenant authorization independently of UI route scoping.
- [ ] Mark all demo screens clearly and ensure demo actions do not call APIs or claim persistence.
- [ ] Test Persian text wrapping, mixed Latin/number input, dates, and mobile widths.

## Phase 8 — Brand delivery and governance

- Keep the brand palette and CSS variables centralized in `app/globals.css`.
- Use `HamOwjMark` for monochrome/current-color contexts and `HamOwjMarkSvg` for the theme-aware two-tone mark.
- The approved working palette remains: ivory `#F6F3ED`, orange `#FB9A3C`, slate `#788584`, bronze `#A96D20`, stone `#463F41`, and ink `#1B1A1B`.
- The logo SVG is a vector source; do not redraw it independently in feature pages.
- Any future tenant themes must use an allowlisted token set, be scoped to the tenant shell, and never alter auth branding globally unless explicitly requested.
- Review new UI against contrast, RTL layout, keyboard access, responsive behavior, and reduced-motion before release.
