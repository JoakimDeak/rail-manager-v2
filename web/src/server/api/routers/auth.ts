import { TRPCError } from '@trpc/server'
import jwt from 'jsonwebtoken'
import * as OTPAuth from 'otpauth'
import z from 'zod'

import { env } from '~/env'
import {
  createTRPCRouter,
  publicProcedure,
  sessionProtectedProcedure,
} from '~/server/api/trpc'

import {
  type AccessTokenPayload,
  AUTHENTICATOR_CODE_DIGITS,
  type RefreshTokenPayload,
  refreshTokenPayloadSchema,
} from '../auth'

export const authRouter = createTRPCRouter({
  link: sessionProtectedProcedure.mutation(async ({ ctx }) => {
    const secret = new OTPAuth.Secret()
    const totp = new OTPAuth.TOTP({
      issuer: 'Rail Manager v2',
      label: ctx.session.user.email ?? undefined,
      digits: AUTHENTICATOR_CODE_DIGITS,
      secret,
    })

    await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: {
        totp_secret: secret.base32,
      },
    })

    return totp.toString()
  }),
  validate: sessionProtectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      })
      if (!user?.totp_secret) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Linking process has not been started',
        })
      }
      const totp = new OTPAuth.TOTP({
        secret: user.totp_secret,
      })
      const delta = totp.validate({ token: input.code, window: 1 })
      if (delta === null) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid code' })
      }
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          totp_verified: true,
        },
      })
    }),
  unlink: sessionProtectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      })
      if (!user?.totp_secret) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User has no linked authenticator to unlink',
        })
      }
      const totp = new OTPAuth.TOTP({
        secret: user.totp_secret,
      })
      const delta = totp.validate({ token: input.code, window: 1 })
      if (delta === null) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid code' })
      }

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          totp_verified: false,
          totp_secret: null,
        },
      })
    }),
  generateRefreshToken: publicProcedure
    .input(z.object({ email: z.string().email(), code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      })
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
        })
      }
      if (!user.totp_verified || !user.totp_secret) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
        })
      }
      const totp = new OTPAuth.TOTP({
        secret: user.totp_secret,
      })
      const delta = totp.validate({ token: input.code, window: 1 })
      if (delta === null) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const refreshToken = jwt.sign(
        {
          email: user.email,
          version: user.token_version,
        } satisfies RefreshTokenPayload,
        env.REFRESH_TOKEN_SECRET,
      )
      const accessToken = jwt.sign(
        { email: user.email } satisfies AccessTokenPayload,
        env.ACCESS_TOKEN_SECRET,
      )

      return { refreshToken, accessToken }
    }),
  generateAccessToken: publicProcedure.mutation(async ({ ctx }) => {
    const refreshToken = ctx.headers.get('Authorization')?.split(' ')?.[1]
    if (!refreshToken) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }
    const { data: payload, error } = refreshTokenPayloadSchema.safeParse(
      jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET),
    )
    if (error) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const user = await ctx.db.user.findUnique({
      where: { email: payload.email },
      select: { token_version: true },
    })
    if (user?.token_version !== payload.version) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Refresh token has been revoked',
      })
    }

    const accessToken = jwt.sign(
      { email: payload.email } satisfies AccessTokenPayload,
      env.ACCESS_TOKEN_SECRET,
    )

    return { accessToken }
  }),
  rotateRefreshTokens: sessionProtectedProcedure.mutation(async ({ ctx }) => {
    return ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: {
        token_version: { increment: 1 },
      },
    })
  }),
})
