# Branding and tenant registration migration

- Replaced Shifty branding and employee/attendance/leave-oriented tenant UI with the Persian-first gym-group product identity **قدرت**.
- Redesigned the sign-in and tenant registration experience with a dark graphite / lime-accent athletic visual system, stronger typography, and RTL-first layouts.
- Registration now presents three gym-focused steps: gym group identity and tenant address, group owner profile, and phone verification.
- Kept the existing registration/authentication server actions and domain availability endpoint so this UI change does not invent .NET API routes.
- Updated tenant role labels to owner, group admin, branch manager, trainer, and member.
- Removed legacy employee-management pages, HR reports, attendance/leave screens, associated unused models/actions, old logo assets, and old product-domain references.
- Replaced checked-in environment values with safe local/example settings. Configure the actual API URL, domain, and a strong `AUTH_SECRET` before deployment.
- Gym feature pages continue to show honest disconnected/empty states until the .NET backend contracts are connected. Exercise media is rendered only when the backend supplies a URL.

## Validation status

- Source search: no remaining Shifty brand/domain strings or legacy HR screen labels found.
- Dependency installation was attempted but the package registry timed out, so ESLint, TypeScript, and production build could not be run in this environment.
