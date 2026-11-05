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
        if (url.pathname === '/') {
          return NextResponse.redirect(new URL('/signup', request.url))
        }

        // Allow public pages on the main domain
        if (publicPages.includes(url.pathname)) {
          return NextResponse.next()
        }

        // Main domain cannot access tenant dashboard
        return NextResponse.redirect(new URL('/signup', request.url))
      }

      // 2. No valid tenant subdomain
      if (!isSubdomain || !subdomain) {
        return redirectToRootSignup()
      }

      // 3. Check whether the tenant exists
      const isTenantExist = await checkDomain(subdomain)

      if (!isTenantExist) {
        return redirectToRootSignup()
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

      return NextResponse.next()
    },
  },

  providers: [],
} satisfies NextAuthConfig

