import { jwtDecode } from 'jwt-decode'
import NextAuth, { CredentialsSignin } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'

import { SigninUserModel } from '@/app/(auth)/signin/_types/signin-user-model.type'
import { createData } from '@/core/http-service'
import { Problem } from '@/types/http-errors.interface'
import { SignedInUser, UserSession, User } from '@/types/user.interface'
import { normalizeProblem } from '@/utils/normalize-problem'

import { authConfig } from './auth-config'

declare module 'next-auth' {
  interface User {
    accessToken: string
  }

  interface Session {
    user: UserSession
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user: User
  }
}

export class AuthorizeError extends CredentialsSignin {
  code = 'authorize_error'
  problem: Problem

  constructor(problem: Problem) {
    super('authorize_error')
    this.problem = problem
  }
}

export const {
  signIn,
  signOut,
  auth,
  handlers: { GET, POST },
} = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        // Fast path: signinAction already validated the credentials against the API
        // and passes the resulting token. authorize() just trusts it.
        accessToken: { label: 'accessToken', type: 'text' },
        // Fallback: direct credential post (e.g. a form that doesn't use the server action).
        userName: { label: 'userName', type: 'text', required: false },
        password: { label: 'password', type: 'text', required: false },
      },
      async authorize(credentials) {
        // 1) Token already issued by our own server action — trust it.

        console.log("on cred")
        if (credentials?.accessToken) {
          return { accessToken: credentials.accessToken as string }
        }

        // 2) Fallback: perform the login ourselves so `Problem` is preserved.
        if (!credentials?.userName || !credentials?.password) {
          return null
        }

        try {
          const user = await createData<SigninUserModel, SignedInUser>('user/login', {
            userName: credentials.userName as string,
            password: credentials.password as string,
          })

          console.log(user)


          // Some APIs wrap the response (e.g. { data: { token } }). Handle both shapes.
          const raw = user as any
          const token: string | undefined =
            raw?.token ?? raw?.accessToken ?? raw?.data?.token ?? raw?.data?.accessToken

          if (!token) {
            return null
          }

          return { accessToken: token }
        } catch (error: unknown) {
          throw new AuthorizeError(
            normalizeProblem(error, 'نام کاربری یا رمز عبور اشتباه است'),
          )
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.accessToken) {
        token.user = jwtDecode<User>(user.accessToken)
        token.user.accessToken = user.accessToken
      }
      return token
    },
    async session({ session, token }) {
      Object.assign(session.user, token.user ?? {})
      return session
    },
  },
})