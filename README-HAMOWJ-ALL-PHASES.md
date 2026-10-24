# HamOwj — all-phase frontend update

This archive contains the source tree from the supplied `Front.zip` plus the HamOwj phase updates. The existing auth route/form files under `app/(auth)` were not modified.

## Phase status

- **Phase 1 — Brand foundation:** existing palette, logo, Persian-first typography and metadata retained.
- **Phase 2 — Design system:** reusable CSS tokens for surfaces, borders, focus rings, shadows, responsive behavior and reduced motion.
- **Phase 3 — Application branding:** tenant-aware sidebar destinations and breadcrumbs; branded shell surfaces and responsive padding.
- **Phase 4 — Role-oriented experiences:** interactive local demo workspaces for dashboard, branches, members, trainer assignments, routines, workouts/history, progress, measurements, imports/exports and settings. These areas intentionally use fake local data until the APIs exist. The existing exercise library continues to use its supplied API integration.
- **Phase 5 — Tenant branding/isolation:** allowlisted theme tokens and a constrained tenant-branding UI contract. No missing branding API is assumed. Backend authorization remains mandatory.
- **Phase 6 — Localization foundation:** Persian-first message dictionary, English equivalents for common shell/features and RTL/LTR direction helper. Root remains Persian/RTL by default; full translation coverage and locale routing are follow-up integration work, not falsely claimed complete.
- **Phase 7 — QA/release readiness:** reduced-motion support, focus styles, manual QA checklist and a fix for the reported logo fill hydration mismatch.
- **Phase 8 — Brand governance:** centralized palette, reusable logo guidance, tenant theme allowlist and accessibility/release rules.

## Validation notes

The original archive does not include the root `package.json`, lockfile, or `tsconfig.json`, so this archive cannot be fully built, linted, or type-checked in isolation. Run your normal checks from the original repository with its package manifest and lockfile. The auth form/page files were compared against the supplied source tree and remain unchanged.

## API safety

Only the existing exercise API integration is treated as live. All other gym features use explicitly labelled demo data and local React state. They do not call guessed endpoints or claim server persistence. Tenant scoping in the URL is not an authorization boundary; the .NET API must enforce tenant/role access.
