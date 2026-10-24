# HamOwj UI implementation notes — Phases 2–4

## Scope
- Phase 2: reusable branded surface, card, divider, focus and motion tokens/utilities are in `app/globals.css`.
- Phase 3: tenant-aware navigation and dashboard breadcrumbs; responsive tenant content padding; shared header/surface styling. Tenant navigation links preserve `/tenants/{tenant}` rather than escaping to root routes.
- Phase 4: interactive demo workspaces for dashboard, branches, members, trainer assignments, routines, workout session, workout history, progress, body measurements, imports/exports, and preferences.

## Demo-data boundary
The Phase 4 API contracts supplied so far are explicitly not implemented. The UI uses clearly labelled local demo data and local React state only. Add/remove/search/filter/form actions do not call the backend and do not persist across reloads. No new endpoint, DTO, authorization claim, or server behavior has been assumed. Exercise library behavior remains connected to its existing API implementation.

## Authentication boundary
Login, registration, and authentication implementation files were not edited as part of this work.

## Validation limitation
The provided `Front.zip` did not include a root `package.json`, lockfile, or TypeScript configuration, so a dependency-aware build, lint, and typecheck could not be run against this archive. Validate in the original repository with its actual package manifest and lockfile before merging.
