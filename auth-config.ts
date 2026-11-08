import { NextResponse } from 'next/server'
import type { NextAuthConfig } from 'next-auth'

import { BASE_DOMAIN } from '@/configs/global'
import { checkDomain } from '@/utils/check-domain'

export const authConfig = {
  pages: {
    signIn: '/signin',
  },

  callbacks: {
    async authorized({ auth, request }) {
      const url = request.nextUrl.clone()

      const host = request.headers.get('host') || BASE_DOMAIN!
      const hostname = host.split(':')[0].toLowerCase()

      const baseDomain = BASE_DOMAIN!.split(':')[0].toLowerCase()

      const isAuthenticated = !!auth?.user

      const publicPages = [
        '/signin',
        '/forget-password',
        '/not-found',
        '/verify-account',
        '/signup',
      ]

      // Public marketing site, checkout and the tenant-less platform console. These live on the
      // bare base domain and must never need a gym (or a session) to render.
      const sitePaths = [
        '/',
        '/pricing',
        '/start',
        '/features',
        '/contact',
        '/sitemap.xml',
        '/robots.txt',
      ]

      const isSitePath =
        sitePaths.includes(url.pathname) ||
        url.pathname.startsWith('/p/') ||
        url.pathname.startsWith('/admin')

      const redirectToRootSignup = () => {
        const signupUrl = new URL(request.url)

        signupUrl.hostname = baseDomain
        signupUrl.port = ''
        signupUrl.pathname = '/signup'
        signupUrl.search = ''

        return NextResponse.redirect(signupUrl)
      }
      // Determine whether the request belongs to a tenant
      const isBaseDomain =
        hostname === baseDomain || hostname === `www.${baseDomain}`

      const isSubdomain =
        hostname.endsWith(`.${baseDomain}`) && hostname !== `www.${baseDomain}`

      const subdomain = isSubdomain
        ? hostname.slice(0, -(baseDomain.length + 1))
        : null

      // 1. Root domain or www without a tenant
      if (isBaseDomain) {
        // Static files (icons, images, fonts) keep their own URLs on the base domain.
        if (/\.[a-z0-9]+$/i.test(url.pathname)) {
          return NextResponse.next()
        }

        // The public site and /admin have no tenant; the sign-in/sign-up pages stay public too.
        if (isSitePath || publicPages.includes(url.pathname)) {
          return NextResponse.next()
        }

        // Main domain cannot access a tenant dashboard.
        return NextResponse.redirect(new URL('/', request.url))
      }

      // 2. No valid tenant subdomain
      if (!isSubdomain || !subdomain) {
        return redirectToRootSignup()
      }

      // The platform console is tenant-less: a gym host never serves it, even for its owner.
      if (url.pathname.startsWith('/admin')) {
        const consoleUrl = new URL(request.url)
        consoleUrl.hostname = baseDomain
        consoleUrl.port = ''
        consoleUrl.pathname = url.pathname

        return NextResponse.redirect(consoleUrl)
      }

      // `/` on a gym host is the staff dashboard. The page itself lives at an internal path so
      // the platform marketing site can own `/` on the bare domain; keep that path unaddressable.
      if (url.pathname === '/console-home') {
        return NextResponse.redirect(new URL('/', request.url))
      }

      // 3. Check whether the tenant exists.
      //    A signed-in session was issued for this host, and the backend answers a tenant change
      //    with 401 — so after login there is nothing to re-check on every navigation. This also
      //    stops a flaky VPN/proxy connection from bouncing a real gym to the signup page.
      //    Unauthenticated visitors are checked once (cached); an unreachable API (`null`) is not
      //    treated as "tenant missing".
      if (!isAuthenticated) {
        const isTenantExist = await checkDomain(subdomain)

        if (isTenantExist === false) {
          return redirectToRootSignup()
        }
      }

      // 4. Allow public pages on valid tenant domains
      if (publicPages.includes(url.pathname)) {
        if (isAuthenticated && url.pathname === '/signin') {
          return NextResponse.redirect(new URL('/', request.url))
        }

        return NextResponse.next()
      }

      // 5. Require authentication for tenant dashboard
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/signin', request.url))
      }

      if (url.pathname === '/') {
        return NextResponse.rewrite(new URL('/console-home', request.url))
      }

      return NextResponse.next()
    },
  },

  providers: [],
} satisfies NextAuthConfig

