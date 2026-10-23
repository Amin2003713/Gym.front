# قدرت | سامانه مدیریت گروه‌های ورزشی

A Persian-first, right-to-left multi-tenant gym-group portal built on Next.js 16 and React 19. The existing tenant routing and authentication infrastructure are retained while the tenant-facing experience is being migrated toward the openGym workout feature set.

## Tenant features in this phase

- Gym-group dashboard entry point
- Exercise library UI shell
- Routines and guided-workout UI shells
- Workout history, progress and body measurements
- Import/export UI shell
- Branch, member and trainer-assignment UI shells
- Gym preference settings
- Typed domain models, Zod validation schemas and a `GymApi` contract

## API integration boundary

The actual .NET backend has not been supplied yet. Therefore, the new `features/gym/api/contracts.ts` defines the operations the frontend needs without assuming that any particular route exists. The default adapter throws `GymApiNotConfiguredError` and does not produce mock data or send requests to guessed endpoints. Feature actions remain disabled and pages show disconnected/empty states until the real API adapter is implemented.

When the backend source is available, map `GymApi` operations to the actual routes and DTOs, add explicit DTO-to-UI mappers, and validate response payloads with `features/gym/domain/schemas.ts`. Tenant scope and trainer-to-member authorization must be enforced by the server, not just by frontend navigation.

## Tenant registration and domains

The existing registration endpoints and authentication flow have been preserved for now, while the registration copy now describes a gym group. The preview suffix uses `NEXT_PUBLIC_TENANT_DOMAIN_SUFFIX`, falling back to `NEXT_PUBLIC_BASE_DOMAIN`. Environment files now use safe example/local values rather than the former product domain or a committed auth secret. Replace `AUTH_SECRET`, `NEXT_PUBLIC_API_URL`, and `NEXT_PUBLIC_BASE_DOMAIN` with deployment-specific values before production.

## Development

```bash
npm install
npm run dev
```

Use `npm run lint` and `npm run build` before deployment. The build could not be run in the current editing environment because dependencies were not installed and the package registry was unreachable.

## openGym reference and licensing

The intended UI/feature reference is [DuarteSantos8/openGym](https://github.com/DuarteSantos8/openGym). Its source is licensed under AGPL-3.0-or-later. This phase establishes a Next.js tenant integration scaffold and frontend contracts; it does not vendor the upstream source tree or its exercise media. Review the upstream `LICENSE` and `NOTICE.md` before importing/adapting source. Exercise images, GIFs and animated SVGs are only rendered when a URL is supplied by your backend or by an asset source for which you have permission.
