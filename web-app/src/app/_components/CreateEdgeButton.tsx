'use client'

import { api } from '~/trpc/react'

export const CreateEdgeButton = ({ worldId }: { worldId: number }) => {
  const utils = api.useUtils()
  const test = api.edge.create.useMutation({
    onSuccess: async () => {
      await utils.edge.invalidate()
    },
  })

  return (
    <button
      onClick={() => {
        test.mutate({ node1Id: 1, node2Id: 2, weight: 1, worldId })
      }}
    >
      Create edge
    </button>
  )
}
