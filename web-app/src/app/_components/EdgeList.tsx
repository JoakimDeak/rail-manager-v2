'use client'

import { api } from '~/trpc/react'
import { Edge } from './Edge'

export const EdgeList = ({ worldId }: { worldId: number }) => {
  const { data: edges } = api.edge.getAll.useQuery({ worldId })
  return (
    <div>
      Edges:
      {edges?.map((edge) => (
        <Edge edge={edge} key={edge.id} />
      ))}
    </div>
  )
}
