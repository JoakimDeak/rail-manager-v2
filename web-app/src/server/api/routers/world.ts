import { z } from 'zod'

import {
  createTRPCRouter,
  protectedProcedure,
  sessionProtectedProcedure,
} from '~/server/api/trpc'

// TODO: Rename world to network

export const worldRouter = createTRPCRouter({
  create: sessionProtectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.world.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      })
    }),
  delete: sessionProtectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.world.delete({
        where: { id: input.id },
      })
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const worlds = await ctx.db.world.findMany({
      where: { createdBy: { id: ctx.userId } },
      orderBy: { createdAt: 'asc' },
    })

    return worlds ?? null
  }),
  get: sessionProtectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const world = await ctx.db.world.findUnique({
        where: { id: input.id },
      })

      return world ?? null
    }),
  update: sessionProtectedProcedure
    .input(z.object({ id: z.number(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.world.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      })
    }),
})
