import { postRouter } from '~/server/api/routers/post'
import { worldRouter } from '~/server/api/routers/world'
import { createCallerFactory, createTRPCRouter } from '~/server/api/trpc'
import { nodeRouter } from './routers/node'
import { edgeRouter } from './routers/edge'

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  world: worldRouter,
  node: nodeRouter,
  edge: edgeRouter,
})

// export type definition of API
export type AppRouter = typeof appRouter

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter)
