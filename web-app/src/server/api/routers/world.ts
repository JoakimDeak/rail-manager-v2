import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const worldRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.world.create({
        data: {
          name: input.name,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.world.delete({
        where: { id: input.id },
      })
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const worlds = await ctx.db.world.findMany({
      where: { createdBy: { id: ctx.session.user.id } },
      orderBy: { createdAt: 'asc' },
    })

    return worlds ?? null
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const world = await ctx.db.world.findFirst({
        where: { id: input.id },
      })

      return world ?? null
    }),
})
