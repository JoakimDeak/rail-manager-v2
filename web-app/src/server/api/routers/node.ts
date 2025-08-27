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
        orderBy: { createdAt: 'asc' },
      })

      return nodes ?? null
    }),
  delete: protectedProcedure
    .input(z.object({ nodeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.node.delete({
        where: { id: input.nodeId },
      })
    }),
  update: protectedProcedure
    .input(z.object({ name: z.string(), nodeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.node.update({
        where: { id: input.nodeId },
        data: {
          name: input.name,
          worldId: undefined,
          id: undefined,
        },
      })
    }),
})
