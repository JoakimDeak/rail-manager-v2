import type { ServerWebSocket } from 'bun'

const connections = new Set<ServerWebSocket<unknown>>()

const server = Bun.serve({
  port: 3100,
  // TODO: Add trigger endpoint
  fetch(req, server) {
    const success = server.upgrade(req)
    if (success) {
      return undefined
    }
  },
  // TODO: Add world id to ws
  websocket: {
    async message(ws, message) {},
    open: (ws) => {
      connections.add(ws)
      console.log('websocket connection was opened')
    },
  },
})

setInterval(() => {
  connections.forEach((connection) => {
    if (Math.random() > 0.5) {
      console.log('send 1,2,3')
      connection.send(JSON.stringify([1, 2, 3]))
    } else {
      console.log('send 3,2,1')
      connection.send(JSON.stringify([3, 2, 1]))
    }
  })
}, 10 * 1000)

console.log(`Websocket server running on ${server.url}`)
