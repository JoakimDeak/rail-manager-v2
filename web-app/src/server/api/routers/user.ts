import { createTRPCRouter, sessionProtectedProcedure } from '~/server/api/trpc'

export const userRouter = createTRPCRouter({
  get: sessionProtectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
    })

    return user ?? null
  }),
})
