import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const nodeRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1), worldId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.node.create({
        data: {
          name: input.name,
          world: { connect: { id: input.worldId } },
        },
      })
    }),

  getAll: protectedProcedure
    .input(z.object({ worldId: z.number() }))
    .query(async ({ ctx, input }) => {
      const nodes = await ctx.db.node.findMany({
        where: {
          world: { id: input.worldId },
        },
        orderBy: { name: 'asc' },
      })

      return nodes ?? null
    }),
})
