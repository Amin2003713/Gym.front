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
      const hostParts = host.split('.')
      const subdomain = hostParts[0]
      const isAuthenticated = !!auth?.user
      const publicPages = [
        '/signin',
        '/forget-password',
        '/not-found',
        '/verify-account',
      ]
      const validSubdomain = subdomain !== 'www' && hostParts.length > 1
    

      // Tenant identity comes from the subdomain (validated above) and the
      // session JWT; dashboard routes live at root paths, so no rewrite —
      // and no tenant key in the URL — is needed.

      if (!validSubdomain && request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/signup', request.url))
      }

      if (validSubdomain && !publicPages.includes(request.nextUrl.pathname)) {
        const isExist = await checkDomain(subdomain)

        if (isExist) {
          if (isAuthenticated) {
            return NextResponse.next()
          } else {
            return NextResponse.redirect(new URL(`/signin`, request.url))
          }
        } else {
          return NextResponse.redirect(new URL('/not-found', request.url))
        }
      }

      // جلوگیری از دسترسی به لاگین در صورت احراز هویت
      if (isAuthenticated && url.pathname.startsWith('/signin')) {
        return NextResponse.redirect(new URL(`/`, request.url))
      }

      if (
        !validSubdomain &&
        ['/signin', '/forget-password', '/verify-account'].some((path) =>
          request.nextUrl.pathname.includes(path),
        )
      ) {
        return NextResponse.redirect(new URL('/not-found', request.url))
      }

      return NextResponse.next()
    },
  },
  providers: [],
} satisfies NextAuthConfig
