import Database from 'bun:sqlite'

export type Node = {
  id: number
  name: string
}
export type Edge = {
  id: number
  weight: number
  node1Id: number
  node2Id: number
}

const db = new Database('../db.sqlite', { create: false, readonly: true })

export const getEdges = (worldId: number) => {
  return db
    .query<Edge, number>(
      `
        SELECT id, weight, node1Id, node2Id
        FROM Edge
        WHERE worldId = ?1
      `
    )
    .all(worldId)
}

export const getNodes = (worldId: number) => {
  return db
    .query<Node, number>(
      `
          SELECT id, name
          FROM Node
          WHERE worldId = ?1
        `
    )
    .all(worldId)
}
