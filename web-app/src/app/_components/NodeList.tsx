'use client'

import { api } from '~/trpc/react'

export const NodeList = ({ worldId }: { worldId: number }) => {
  const { data: nodes } = api.node.getAll.useQuery({ worldId })
  return (
    <div className="flex flex-col gap-1">
      nodes:
      {nodes?.map((node) => (
        <div key={node.id}>{node.id}</div>
      ))}
    </div>
  )
}
