import type { ServerWebSocket } from 'bun'
import z from 'zod'
import { getPath } from './pathfinding'

const connections = new Set<ServerWebSocket<{ worldId: number }>>()

const routeBodySchema = z.object({ from: z.number(), to: z.number() })

const server = Bun.serve({
  port: 3100,
  fetch(req, server) {
    const worldId = new URL(req.url).searchParams.get('worldId')
    if (worldId === null) {
      return new Response(undefined, { status: 400 })
    }
    const success = server.upgrade(req, {
      data: { worldId },
    })

    if (success) {
      return undefined
    }
  },
  websocket: {
    async message(ws: ServerWebSocket<{ worldId: number }>, message) {
      try {
        if (typeof message !== 'string') {
          throw new Error()
        }
        const { from, to } = routeBodySchema.parse(JSON.parse(message))
        const path = getPath(ws.data.worldId, from, to)
        if (!path) {
          throw new Error()
        }
        ws.send(JSON.stringify({ success: true, path }))
      } catch (e) {
        ws.send(JSON.stringify({ success: false }))
      }
    },
    open: (ws: ServerWebSocket<{ worldId: number }>) => {
      connections.add(ws)
      console.log('connections', connections.size)
    },
    close: (ws: ServerWebSocket<{ worldId: number }>) => {
      connections.delete(ws)
    },
  },
})

console.log(`Websocket server running on ${server.url}`)
