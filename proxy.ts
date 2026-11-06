import NextAuth from 'next-auth'

import { authConfig } from '@/auth-config'

export const proxy = NextAuth(authConfig).auth

export const config = {
  matcher: [
    // The worker, manifest, install icons, and offline fallback must stay public on every
    // tenant host; auth redirects on these paths make the PWA uninstallable.
    '/((?!_next/static|_next/image|images|favicon.ico|icons|manifest.webmanifest|sw.js|offline).*)',
  ],
}
