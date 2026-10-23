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
    // The server action has already authenticated the user.
    // Reuse that token instead of calling the login API again.
    const accessToken = credentials?.accessToken

    if (
      typeof accessToken === 'string' &&
      accessToken.length > 0
    ) {
      return {
        accessToken,
      }
    }

    // Optional fallback for normal username/password sign-in.
    if (
      typeof credentials?.userName !== 'string' ||
      typeof credentials?.password !== 'string'
    ) {
      return null
    }

    const user = await createData<SigninUserModel, SignedInUser>(
      'user/login',
      {
        userName: credentials.userName,
        password: credentials.password,
      },
    )

    if (!user?.token) {
      return null
    }

    return {
      accessToken: user.token,
    }
  } catch (error: unknown) {
    console.error('Credentials authorization failed:', error)
    throw new AuthorizeError(error as Problem)
  }
}
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
              console.log("decode ")

        token.user = jwtDecode<User>(user.accessToken)
        token.user.accessToken = user.accessToken
              console.log("sat in calback")

      }
      return token
    },
    async session({ session, token }) {
      Object.assign(session.user, token.user ?? {})
      return session
    },
  },
})
