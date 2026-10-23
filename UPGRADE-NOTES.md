# Framework and dependency upgrade notes

This source has been moved to the current stable Next.js 16 line and React 19.3 patch line.

## Key changes

- Next.js: `16.4.2` (stable, patched release)
- React / React DOM: `19.3.1`
- `eslint-config-next`: `16.4.2`
- Tailwind CSS and `@tailwindcss/postcss`: `4.3.x`
- NextAuth: `5.0.0-beta.32`
- Node.js minimum: `22.0.0`
- Migrated `middleware.ts` to the Next.js 16 `proxy.ts` convention.
- Removed the unused `experimental.authInterrupts` flag.
- Removed redundant explicit Turbopack flags; Next.js 16 uses Turbopack by default.

## Install and verify

The previous lockfile was tied to Next.js 15 and React 19.1. Registry access was unavailable during this upgrade, so the stale lockfile was removed rather than leaving an inconsistent `npm ci` lock. Run these commands with npm registry access to resolve all compatible dependency patch/minor updates and create a fresh lockfile:

```bash
npm install
npm run lint
npx tsc --noEmit
npm run build
```

The application has not been dependency-installed or production-built in this environment, so runtime/build compatibility still needs to be verified after install. Review any Next.js 16 async `params` / `searchParams` type errors reported by `tsc` and migrate those call sites to await the promise-based APIs.
