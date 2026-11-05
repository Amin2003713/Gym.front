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

## Live rooms (WebRTC)

Member room: `/live`. Staff room: `/live-console`. Both use the SignalR hub at `/hubs/live` for signaling only; media flows peer-to-peer and never through the API.

- `support` mode is a small mesh call (up to 12 peers).
- `webinar` mode has the host publish and viewers receive, with chat and raise-hand.
- Rooms are in-memory, room-code based and intended for trusted internal use. They are lost on API restart, are not recorded, and are not multi-instance safe (a Redis backplane would be required).

Browsers require a secure context for camera and microphone. `localhost` is exempt; any other host must be served over HTTPS. WebRTC media is always encrypted with DTLS-SRTP, and signaling is upgraded to WSS automatically when the page is HTTPS. Outside a local network, configure a TURN server, otherwise restrictive NATs will fail to connect:

```bash
NEXT_PUBLIC_STUN_URL=stun:stun.l.google.com:19302
# One or more comma-separated URLs. Prefer a TLS endpoint outside the LAN.
NEXT_PUBLIC_TURN_URLS=turns:turn.example.com:5349,turn:turn.example.com:3478
NEXT_PUBLIC_TURN_USERNAME=...
NEXT_PUBLIC_TURN_CREDENTIAL=...
```

`turns:` requires a valid certificate (and port 5349 by convention) on the TURN server. `NEXT_PUBLIC_TURN_URL` is still accepted as a single-URL fallback. These credentials are exposed to the browser, so use short-lived TURN credentials in production. Leave the TURN variables empty for local development. The API exposes the hub at `http://localhost:5100/hubs/live` in development; rebuild/restart the API container after backend changes because its entrypoint loads the compiled assembly once.

## Progress photo storage

Progress photos are encrypted with AES-256-GCM before leaving the API and the ciphertext is stored in the private MinIO bucket `gym-progress-photos`. SQL keeps only metadata, the object key, nonce and tag; the bucket has no anonymous policy and the API never issues presigned photo URLs. Reads still go through `GET /api/progressphotos/{id}/content`, which authorizes the owner or their coach before decrypting.

On startup, the seeder moves any legacy ciphertext rows into the bucket and clears the old column. If MinIO is unavailable it logs a warning and retries on the next startup. Keep the bucket private in MinIO as well (`mc anonymous set none gym-progress-photos`).
