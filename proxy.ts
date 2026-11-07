import NextAuth from 'next-auth'

import { authConfig } from '@/auth-config'

export const proxy = NextAuth(authConfig).auth

export const config = {
  matcher: [
    // The manifest, install icons and the retirement worker must stay public on every tenant
    // host; auth redirects here make the PWA uninstallable and block stale-worker cleanup.
    '/((?!_next/static|_next/image|images|favicon.ico|icons|manifest.webmanifest|sw.js).*)',
  ],
}
