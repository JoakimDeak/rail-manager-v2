import Database from 'bun:sqlite'
import { invalidateCache } from './pathfinding'

// TODO: Remove table create
// Keep only queries used by pathfinding

export type Node = {
  id: number
  name: string
}
export type NodeWithEdgeCount = Node & {
  edgeCount: number
}
export type Edge = {
  id: number
  weight: number
  node1: Node['id']
  node2: Node['id']
}
export type EdgeWithNodeName = Edge & {
  node1Name: Node['name']
  node2Name: Node['name']
}

const db = new Database('src/server/db.sqlite', { create: true })
db.run(`PRAGMA foreign_keys = ON;`)
db.run(
  `
    CREATE TABLE IF NOT EXISTS nodes (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `
)
db.run(
  `
    CREATE TABLE IF NOT EXISTS edges (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      weight  REAL NOT NULL,
      node1   INTEGER NOT NULL,
      node2   INTEGER NOT NULL,
      FOREIGN KEY (node1) REFERENCES Nodes(id) ON DELETE CASCADE,
      FOREIGN KEY (node2) REFERENCES Nodes(id) ON DELETE CASCADE,
      CHECK (node1 < node2),
      UNIQUE (node1, node2)
    );
  `
)

export const createEdge = ({
  from,
  to,
  weight,
}: {
  from: number
  to: number
  weight: number
}) => {
  const res = db.run<[number, number, number]>(
    `
      INSERT INTO edges (node1,node2,weight)
      VALUES(?1,?2,?3)
    `,
    from > to ? [to, from, weight] : [from, to, weight]
  )
  invalidateCache()
  return Number(res.lastInsertRowid)
}

export const deleteEdge = ({ id }: { id: number }) => {
  const res = db.run<[number]>(
    `
      DELETE FROM edges
      WHERE edges.id = ?1
    `,
    [id]
  )
  invalidateCache()
  return res
}

export const updateEdge = ({ id, weight }: { id: number; weight: number }) => {
  const res = db.run<[number, number]>(
    `
      UPDATE edges
      SET weight = ?2
      WHERE edges.id = ?1
    `,
    [id, weight]
  )
  invalidateCache()
  return res
}

export const getEdges = () => {
  return db
    .query<Edge, never[]>(
      `
        SELECT *
        FROM edges
      `
    )
    .all()
}

export const getNodeEdges = ({ id }: { id: number }) => {
  return db
    .query<Edge, [number]>(
      `
        SELECT *
        FROM edges
        WHERE edges.node1 = ?1 OR edges.node2 = ?1
      `
    )
    .all(id)
}

export const getEdgesWithNodeName = () => {
  return db
    .query<EdgeWithNodeName, never[]>(
      `
        SELECT 
          edges.*,
          node1.name as node1Name,
          node2.name as node2Name
        FROM edges
        LEFT JOIN nodes node1 ON edges.node1 = node1.id
        lEFT JOIN nodes node2 ON edges.node2 = node2.id
      `
    )
    .all()
}

export const getEdgeWithNodeName = ({ id }: { id: number }) => {
  return db
    .query<EdgeWithNodeName, [number]>(
      `
        SELECT 
          edges.*,
          node1.name as node1Name,
          node2.name as node2Name
        FROM edges
        LEFT JOIN nodes node1 ON edges.node1 = node1.id
        lEFT JOIN nodes node2 ON edges.node2 = node2.id
        WHERE edges.id = ?1
      `
    )
    .get(id)
}

export const createNode = ({ name }: { name: string }) => {
  return Number(
    db.run<[string]>(
      `
        INSERT INTO nodes (name)
        VALUES(?1)
      `,
      [name]
    ).lastInsertRowid
  )
}

export const getNodes = () => {
  return db
    .query<Node, never[]>(
      `
        SELECT *
        FROM nodes
      `
    )
    .all()
}

export const getNode = ({ id }: { id: number }) => {
  return db
    .query<Node, [number]>(
      `
        SELECT *
        FROM nodes
        WHERE nodes.id = ?1
      `
    )
    .get(id)
}

export const getNodeByName = ({ name }: { name: string }) => {
  return db
    .query<Node, [string]>(
      `
      SELECT *
      FROM nodes
      WHERE nodes.name = ?1
    `
    )
    .get(name)
}

export const getNodeWithEdgeCount = ({ id }: { id: number }) => {
  return db
    .query<NodeWithEdgeCount, [number]>(
      `
        SELECT
          nodes.*,
          COUNT(*) AS edgeCount
        FROM nodes
        LEFT JOIN edges ON edges.node1 = nodes.id OR edges.node2 = nodes.id
        WHERE nodes.id = ?1
        GROUP BY nodes.id;
      `
    )
    .get(id)
}

export const getNodesWithEdgeCount = () => {
  return db
    .query<NodeWithEdgeCount, never[]>(
      `
        SELECT
          nodes.*,
          COUNT(edges.id) AS edgeCount
        FROM nodes
        LEFT JOIN edges ON edges.node1 = nodes.id OR edges.node2 = nodes.id
        GROUP BY nodes.id;
      `
    )
    .all()
}

export const updateNode = ({ id, name }: { id: number; name: string }) => {
  db.run<[number, string]>(
    `
      UPDATE nodes
      SET name = ?2
      WHERE nodes.id = ?1
    `,
    [id, name]
  )
}

export const deleteNode = ({ id }: { id: number }) => {
  const res = db.run<[number]>(
    `
      DELETE FROM nodes
      WHERE id = ?1
    `,
    [id]
  )
  invalidateCache()
  return res
}
