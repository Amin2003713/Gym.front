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
      const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || BASE_DOMAIN || '')
        .split(',')[0]
        .trim()
        .toLowerCase()
        .replace(/:\d+$/, '')
      const baseDomain = BASE_DOMAIN?.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/:\d+$/, '').replace(/\/+$/, '')
      const hostParts = host.split('.')
      const subdomain = hostParts[0]
      const isAuthenticated = !!auth?.user
      const publicPages = ['/signin', '/forget-password', '/not-found']
      const validSubdomain = Boolean(
        baseDomain &&
          host !== baseDomain &&
          host.endsWith(`.${baseDomain}`) &&
          subdomain !== 'www' &&
          subdomain !== 'api' &&
          subdomain !== 'localhost' &&
          subdomain.length > 0,
      )

      // میخواهم زمانیکه زیر دامنه وجود داشت و احراز هویت شده بود و معتبر بود به صفحه های داشبورد دسترسی داشته باشد
      // میخواهم زمانیکه زیر دامنه وجود داشت و معتبر بود ولی احراز هویت نشده بود، به صفحه ی لاگین هدایت شود
      // نباید بدون زیردامنه بتواند به صفحه ی لاگین برود
      // نباید زمانیکه زیردامنه وجود دارد و معتبر است و احرازهویت شده، بتواند به لاگین برود
      // شرایط: زیردامنه وجود دارد، معتبر است و کاربر احراز هویت شده است

      if (!validSubdomain && request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/signup', request.url))
      }

      if (validSubdomain && !publicPages.includes(request.nextUrl.pathname)) {
        const isExist = await checkDomain(subdomain)
        if (isExist) {
          if (isAuthenticated) {
            // هدایت به داشبورد
            return NextResponse.rewrite(
              new URL(
                `/tenants/${subdomain}${url.pathname}${url.search}${url.hash}`,
                request.url,
              ),
            )
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
        ['/signin', '/forget-password', '/tenants'].some((path) =>
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
