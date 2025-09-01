import { type NodeWebSocket } from './web-sockets'

export class MessageHandler {
  private clients: Map<string, NodeWebSocket>
  private queues: Map<string, string[]>

  constructor(clients: Map<string, NodeWebSocket>) {
    this.clients = clients
    this.queues = new Map()
    clients.forEach((_, nodeId) => this.queues.set(nodeId, []))
  }

  public send(client: string, message: string) {
    const ws = this.clients.get(client)
    if (ws) {
      ws.send(message)
      return
    }
    const clientQueue = this.queues.get(client)
    if (!clientQueue) {
      this.queues.set(client, [message])
      return
    }
    clientQueue.push(message)
  }

  public onOpen(ws: NodeWebSocket) {
    const clientQueue = this.queues.get(ws.data.nodeId)
    if (!clientQueue) {
      return
    }

    while (clientQueue.length > 0) {
      const message = clientQueue.shift()
      if (message) {
        ws.send(message)
      }
    }
  }
}
