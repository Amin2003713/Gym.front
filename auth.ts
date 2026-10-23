import { jwtDecode } from 'jwt-decode'
import NextAuth, { CredentialsSignin } from 'next-auth'
import { JWT } from 'next-auth/jwt'
import CredentialsProvider from 'next-auth/providers/credentials'

import { SigninUserModel } from '@/app/(auth)/signin/_types/signin-user-model.type'
import { createData } from '@/core/http-service'
import { Problem } from '@/types/http-errors.interface'
import { SignedInUser, UserSession, User } from '@/types/user.interface'

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
  problem: Problem

  constructor(err: Problem) {
    super()
    this.problem = err
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
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        userName: { label: 'userName', type: 'text' },
        password: { label: 'password', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const user = await createData<SigninUserModel, SignedInUser>(
            `user/login`,
            {
              userName: credentials?.userName as string,
              password: credentials?.password as string,
            },
          )
          // Auth.js expects the user object to be returned
          return {
            accessToken: user.token,
          }
        } catch (error: unknown) {
          throw new AuthorizeError(error as Problem)
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
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
