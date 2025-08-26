import { type Edge, getEdges, getNodes, type Node } from './db'

type PathKey = `${number},${number}`
const getPathKey = (from: number, to: number) => {
  return `${from},${to}` as const satisfies PathKey
}

const pathCache = new Map<PathKey, number[] | undefined>()
const parentGraphCache = new Map<number, Record<number, number>>()

export const invalidateCache = () => {
  pathCache.clear()
  parentGraphCache.clear()
}

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
      .filter(({ node1, node2 }) => curr === node1 || curr == node2)
      .map(({ node1, node2, weight }) => ({
        node: curr === node1 ? node2 : node1,
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

export const getPath = (from: number, to: number) => {
  const pathKey = getPathKey(from, to)
  const reversedKey = getPathKey(to, from)

  if (pathCache.has(pathKey)) {
    return pathCache.get(pathKey)
  } else if (pathCache.has(reversedKey)) {
    pathCache.set(pathKey, pathCache.get(reversedKey)?.toReversed())
    return pathCache.get(pathKey)
  }

  const cachedParentGraph = parentGraphCache.get(from)
  if (cachedParentGraph) {
    const res = pathfind(cachedParentGraph, to)
    pathCache.set(pathKey, res)
    return res
  }
  const cachedReversedParentGraph = parentGraphCache.get(to)
  if (cachedReversedParentGraph) {
    const res = pathfind(cachedReversedParentGraph, from)?.toReversed()
    pathCache.set(pathKey, res)
    return res
  }

  const nodes = getNodes()
  const edges = getEdges()

  const parentGraph = getParentGraph(from, nodes, edges)
  parentGraphCache.set(from, parentGraph)

  const path = pathfind(parentGraph, to)
  pathCache.set(pathKey, path)

  return path
}
