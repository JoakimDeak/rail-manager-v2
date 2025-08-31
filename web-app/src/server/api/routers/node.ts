import { z } from 'zod'

import {
  createTRPCRouter,
  protectedProcedure,
  sessionProtectedProcedure,
} from '~/server/api/trpc'

export const nodeRouter = createTRPCRouter({
  create: sessionProtectedProcedure
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
  // TODO: Add getConnectedNodes
  delete: sessionProtectedProcedure
    .input(z.object({ nodeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.node.delete({
        where: { id: input.nodeId },
      })
    }),
  update: sessionProtectedProcedure
    .input(z.object({ name: z.string(), nodeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.node.update({
        where: { id: input.nodeId },
        data: {
          // TODO: Test that the undefineds are actually necessary
          name: input.name,
          worldId: undefined,
          id: undefined,
        },
      })
    }),
})
