import { type Edge, getEdges, getNodes, type Node } from './db'

const getParentGraph = (start: number, nodes: Node[], edges: Edge[]) => {
  const dists = nodes.reduce((acc, curr) => {
    if (curr.id === start) {
      acc[curr.id] = 0
    } else {
      acc[curr.id] = Infinity
    }
    return acc
  }, {} as Record<string, number>)

  const queue = nodes.slice().map(({ id }) => id)
  const visited = new Set<number>()
  const parents: Record<number, number> = {}

  while (queue.length > 0) {
    const curr = queue
      .filter((node) => !visited.has(node))
      .reduce((min, curr) => {
        // TODO: Check that Infinity is not a stupid fallback
        if (
          min === undefined ||
          (dists[curr] ?? Infinity) < (dists[min] ?? Infinity)
        ) {
          return curr
        }
        return min
      }, undefined as number | undefined)
    if (curr === undefined) {
      break
    }

    visited.add(curr)

    const neighbours = edges
      .filter(({ node1Id, node2Id }) => curr === node1Id || curr == node2Id)
      .map(({ node1Id, node2Id, weight }) => ({
        node: curr === node1Id ? node2Id : node1Id,
        weight,
      }))

    neighbours.forEach((neighbour) => {
      const neighbourDist = dists[neighbour.node]
      const currDist = dists[curr]
      if (currDist === undefined || neighbourDist === undefined) {
        return
      }
      const nextDist = currDist + neighbour.weight
      if (nextDist < neighbourDist) {
        parents[neighbour.node] = curr
        dists[neighbour.node] = nextDist
      }
    })
  }

  return parents
}

const pathfind = (parentGraph: Record<number, number>, end: number) => {
  const path: number[] = [end]
  let prev = parentGraph[end]
  while (prev !== undefined) {
    path.push(prev)
    prev = parentGraph[prev]
  }

  if (path.length === 1) {
    return undefined
  }

  return path.toReversed()
}

// TODO: Add cache that web can invalidate
export const getPath = (worldId: number, from: number, to: number) => {
  const nodes = getNodes(worldId)
  const edges = getEdges(worldId)

  const parentGraph = getParentGraph(from, nodes, edges)

  const path = pathfind(parentGraph, to)

  return path
}
