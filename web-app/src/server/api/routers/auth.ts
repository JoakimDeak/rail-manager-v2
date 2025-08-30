import { TRPCError } from '@trpc/server'
import * as OTPAuth from 'otpauth'
import z from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const authRouter = createTRPCRouter({
  link: protectedProcedure.mutation(async ({ ctx }) => {
    const secret = new OTPAuth.Secret()
    const totp = new OTPAuth.TOTP({
      issuer: 'Rail Manager v2',
      label: ctx.session.user.email ?? undefined,
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
  validate: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      })
      if (!user?.totp_secret) {
        throw new TRPCError({
          code: 'NOT_FOUND',
        })
      }
      const totp = new OTPAuth.TOTP({
        secret: user.totp_secret,
      })
      const delta = totp.validate({ token: input.code, window: 1 })
      if (delta === null) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          totp_verified: true,
        },
      })
    }),
  unlink: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
      })
      if (!user?.totp_secret) {
        throw new TRPCError({
          code: 'NOT_FOUND',
        })
      }
      const totp = new OTPAuth.TOTP({
        secret: user.totp_secret,
      })
      const delta = totp.validate({ token: input.code, window: 1 })
      if (delta === null) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          totp_verified: false,
          totp_secret: null,
        },
      })
      // TODO: Add refresh and access tokens
    }),
})
