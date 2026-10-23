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
