import { getInternalNodes } from '@prisma/client/sql'
import { z } from 'zod'

import {
  createTRPCRouter,
  protectedProcedure,
  sessionProtectedProcedure,
  tokenProtectedProcedure,
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
  getAllInternal: tokenProtectedProcedure
    .input(z.object({ worldId: z.number() }))
    .query(async ({ ctx, input }) => {
      const internalNodes = await ctx.db.$queryRawTyped(
        getInternalNodes(input.worldId),
      )

      return internalNodes ?? null
    }),
  getConnectedNodes: tokenProtectedProcedure
    .input(z.object({ nodeId: z.number() }))
    .query(async ({ ctx, input }) => {
      const connectedNodes = ctx.db.node.findMany({
        where: {
          AND: {
            id: { not: input.nodeId },
            OR: [
              { edges1: { some: { node1Id: input.nodeId } } },
              { edges1: { some: { node2Id: input.nodeId } } },
              { edges2: { some: { node1Id: input.nodeId } } },
              { edges2: { some: { node2Id: input.nodeId } } },
            ],
          },
        },
        select: { name: true, id: true },
      })

      return connectedNodes ?? null
    }),
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
          name: input.name,
        },
      })
    }),
})
