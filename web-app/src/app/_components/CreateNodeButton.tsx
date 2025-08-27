'use client'

import { api } from '~/trpc/react'

export const CreateNodeButton = ({ worldId }: { worldId: number }) => {
  const utils = api.useUtils()
  const createNode = api.node.create.useMutation({
    onSuccess: async () => {
      await utils.node.invalidate()
    },
  })

  return (
    <button
      onClick={() => {
        createNode.mutate({
          worldId: worldId,
          name: 'A new node 2',
        })
      }}
    >
      Create Node
    </button>
  )
}
