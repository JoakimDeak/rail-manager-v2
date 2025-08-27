import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const edgeRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ worldId: z.number() }))
    .query(async ({ ctx, input }) => {
      const edges = await ctx.db.edge.findMany({
        // where: { world: { id: input.worldId } },
        where: {},
        orderBy: { node1Id: 'asc' },
      })

      return edges ?? null
    }),

  create: protectedProcedure
    .input(
      z.object({
        worldId: z.number(),
        weight: z.number(),
        node1Id: z.number(),
        node2Id: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.edge.create({
        data: {
          weight: input.weight,
          node1: { connect: { id: Math.min(input.node1Id, input.node2Id) } },
          node2: { connect: { id: Math.max(input.node1Id, input.node2Id) } },
          world: { connect: { id: input.worldId } },
        },
      })
    }),

  delete: protectedProcedure
    .input(z.object({ edgeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.edge.delete({
        where: { id: input.edgeId },
      })
    }),
  // create: protectedProcedure
  //   .input(z.object({ name: z.string().min(1), worldId: z.number() }))
  //   .mutation(async ({ ctx, input }) => {
  //     return ctx.db.node.create({
  //       data: {
  //         name: input.name,
  //         createdBy: { connect: { id: ctx.session.user.id } },
  //         world: { connect: { id: input.worldId } },
  //       },
  //     })
  //   }),

  // getAll: protectedProcedure
  //   .input(z.object({ worldId: z.number() }))
  //   .query(async ({ ctx, input }) => {
  //     const nodes = await ctx.db.node.findMany({
  //       where: {
  //         AND: [
  //           { createdBy: { id: ctx.session.user.id } },
  //           { world: { id: input.worldId } },
  //         ],
  //       },
  //       orderBy: { name: 'asc' },
  //     })

  //     return nodes ?? null
  //   }),
})
