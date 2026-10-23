# Gym group frontend contracts

This feature folder is the frontend boundary for the tenant-specific gym experience.
It is deliberately separate from the existing API service until the target .NET
backend source is supplied.

## Current phase

- Tenant home now presents a gym-group dashboard entry point.
- Tenant navigation exposes the planned openGym feature areas: exercises, routines,
  guided workouts, workout history, progress, body measurements, import/export,
  branches, members, trainer assignments and settings.
- `domain/types.ts` contains the UI-facing TypeScript contracts.
- `domain/schemas.ts` contains runtime Zod schemas for important payloads.
- `api/contracts.ts` defines the API interface that pages/features will depend on.
- The default `gymApi` adapter intentionally throws `GymApiNotConfiguredError`; it does
  not return demo records or assume route names from an unavailable backend.
- Exercise media is optional. `ExerciseMedia` renders a server-provided image/GIF/
  animated SVG URL and renders nothing when the API does not provide media.

## Next backend integration step

When the .NET backend repository is available, map each `GymApi` operation to the real
route, request DTO, response DTO and authorization policy. Do not trust a tenant ID sent
by the browser: resolve tenant scope from the authenticated request on the server.
Trainer access to workout history and body measurements must be restricted server-side
to the trainer's assigned members. Branch and role permissions must also be enforced by
the API, not only by hiding navigation links.

The contracts are intentionally frontend-oriented and are not asserted to be identical
to the eventual .NET DTOs. Add explicit mapping/normalization functions once the actual
backend DTOs are known.

## Upstream project and media notice

The intended UI reference is [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym),
licensed under AGPL-3.0-or-later. This phase did not vendor its source tree or exercise
media into this project; the frontend scaffold and contracts here are an integration
boundary pending a complete source checkout. Review the upstream `LICENSE` and `NOTICE.md`
before importing/adapting upstream code. Exercise GIFs/animated SVGs/images must come from
your own backend or from media for which you have reuse permission; no upstream exercise
media is included here.

## HamOwj integration update (2026-10-23)

- `api/exercises-api.ts` now maps the supplied exercise endpoints through the existing authenticated HTTP service: list, get by ID, create, update, delete, and POST by-IDs. List paging follows `PagedResult<T>` (`results`, `currentPage`, `pageCount`, `pageSize`, `rowCount`).
- The exercise library now loads real API records and supports search/filtering, paging, details, create, edit and delete. It renders media only when the API returns a usable variant URL; it does not create demo records.
- Create/edit sends the exact command-shaped fields supplied in the request contracts. Muscle IDs are entered as existing GUIDs (`GUID|1` primary or `GUID|2` secondary). Media linking requires an already-uploaded asset ID and the numeric `ExerciseMediaRole` enum value because the enum definition and upload endpoint were not included.
- Phase 2 design tokens add reusable surface/divider/shadow/focus primitives and reduced-motion behavior. Phase 3 applies the HamOwj mark, active navigation styling, and branded page headers to the tenant shell.
- Workout/routine persistence is still intentionally not wired: no workout or routine HTTP routes/request/response DTOs were included with the exercise contracts. The existing workout/routine placeholders remain non-writing rather than calling guessed endpoints. Supply those contracts to connect start/log/complete/history operations safely.
