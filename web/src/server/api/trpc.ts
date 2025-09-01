import { initTRPC, TRPCError } from '@trpc/server'
import jwt from 'jsonwebtoken'
import superjson from 'superjson'
import { ZodError } from 'zod'

import { env } from '~/env'
import { auth } from '~/server/auth'
import { db } from '~/server/db'

import { accessTokenPayloadSchema } from './auth'

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth()

  return {
    db,
    session,
    ...opts,
  }
}
type Context = Awaited<ReturnType<typeof createTRPCContext>>

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router

const getUserFromAuthorization = async ({ ctx }: { ctx: Context }) => {
  const accessToken = ctx.headers.get('Authorization')?.split(' ')?.[1]
  if (!!accessToken) {
    const { data: payload, error } = accessTokenPayloadSchema.safeParse(
      jwt.verify(accessToken, env.ACCESS_TOKEN_SECRET),
    )
    if (!error) {
      return await ctx.db.user.findUnique({
        where: { email: payload.email },
      })
    }
  }
}

const tokenAuth = t.middleware(async ({ next, ctx }) => {
  const user = await getUserFromAuthorization({ ctx })
  if (!user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      userId: user.id,
    },
  })
})

const sessionAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

const multipleAuth = t.middleware(async ({ ctx, next }) => {
  if (ctx.session?.user) {
    return next({
      ctx: {
        userId: ctx.session.user.id,
      },
    })
  }

  const user = await getUserFromAuthorization({ ctx })
  if (user) {
    return next({
      ctx: {
        userId: user.id,
      },
    })
  }

  throw new TRPCError({ code: 'UNAUTHORIZED' })
})

export const publicProcedure = t.procedure
export const sessionProtectedProcedure = t.procedure.use(sessionAuth)
export const tokenProtectedProcedure = t.procedure.use(tokenAuth)
export const protectedProcedure = t.procedure.use(multipleAuth)
