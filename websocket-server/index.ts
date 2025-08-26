import z from 'zod'
import { getNodeByName } from './db'
import { getPath } from './pathfinding'
import handlers, { messageHandler } from './web-sockets'

const bodySchema = z.object({ from: z.string(), to: z.string() })

const server = Bun.serve({
  port: 3100,
  routes: {
    '/api/journeys': {
      POST: async (req) => {
        let body
        try {
          body = await req.json()
        } catch (_) {
          return new Response(undefined, { status: 400 })
        }
        const { data, error } = bodySchema.safeParse(body)
        if (error) {
          return Response.json(z.treeifyError(error))
        }

        const from = getNodeByName({ name: data.from })
        const to = getNodeByName({ name: data.to })

        if (!from || !to) {
          return new Response(undefined, { status: 500 })
        }

        const path = getPath(from.id, to.id)

        if (!path) {
          return new Response("Unknown node or path doesn't exist", {
            status: 400,
          })
        }

        for (let i = 1; i < path.length - 1; i++) {
          // TODO: Test this
          const currNode = path[i]
          if (!currNode) {
            continue
          }
          messageHandler.send(
            currNode.toString(),
            `${path[i - 1]},${path[i + 1]}`
          )
        }

        return new Response()
      },
    },
    '/api/status': new Response('OK'),
  },
  fetch(req, server) {
    const upgradeHeader = req.headers.get('upgrade')
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response(undefined, { status: 404 })
    }

    const nodeId = new URL(req.url).searchParams.get('nodeId')
    if (!nodeId) {
      return new Response(undefined, { status: 400 })
    }

    const wasUpgradeSuccessful = server.upgrade(req, {
      data: { nodeId },
    })
    if (!wasUpgradeSuccessful) {
      return new Response(undefined, { status: 500 })
    }
  },
  websocket: {
    ...handlers,
  },
})

console.log(`Websocket server running on ${server.url}`)
