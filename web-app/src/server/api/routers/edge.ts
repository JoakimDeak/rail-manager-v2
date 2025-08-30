import { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc'

export const edgeRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ worldId: z.number() }))
    .query(async ({ ctx, input }) => {
      const edges = await ctx.db.edge.findMany({
        where: { world: { id: input.worldId } },
        orderBy: { createdAt: 'asc' },
        include: {
          node1: { select: { name: true } },
          node2: { select: { name: true } },
        },
      })

      return edges ?? null
    }),
  create: protectedProcedure
    .input(
      z
        .object({
          worldId: z.number(),
          weight: z.number(),
          node1Id: z.number(),
          node2Id: z.number(),
        })
        .refine(({ node1Id, node2Id }) => node1Id !== node2Id, {
          message: 'Nodes cannot connect to themselves',
        }),
    )
    .mutation(async ({ ctx, input }) => {
      try {
        return await ctx.db.edge.create({
          data: {
            weight: input.weight,
            node1: { connect: { id: Math.min(input.node1Id, input.node2Id) } },
            node2: { connect: { id: Math.max(input.node1Id, input.node2Id) } },
            world: { connect: { id: input.worldId } },
          },
        })
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === 'P2002') {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Edge already exists',
            })
          }
        }
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
      }
    }),
  delete: protectedProcedure
    .input(z.object({ edgeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.edge.delete({
        where: { id: input.edgeId },
      })
    }),
  update: protectedProcedure
    .input(z.object({ edgeId: z.number(), weight: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.edge.update({
        where: { id: input.edgeId },
        data: {
          weight: input.weight,
          id: undefined,
          worldId: undefined,
          node1Id: undefined,
          node2Id: undefined,
        },
      })
    }),
})
