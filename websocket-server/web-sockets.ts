import { type ServerWebSocket } from 'bun'
import { MessageHandler } from './MessageHandler'

export type NodeWebSocket = ServerWebSocket<{ nodeId: string }>

const clients = new Map<string, NodeWebSocket>()
export const messageHandler = new MessageHandler(clients)

const open = (ws: NodeWebSocket) => {
  clients.set(ws.data.nodeId, ws)
  messageHandler.onOpen(ws)
}
const close = (ws: NodeWebSocket) => {
  clients.delete(ws.data.nodeId)
}
const message = () => {}

export default { open, close, message }
