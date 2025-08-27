'use client'

import type { Edge as EdgeType } from '@prisma/client'
import { api } from '~/trpc/react'

export const Edge = ({ edge }: { edge: EdgeType }) => {
  console.log('got edge', edge)
  const utils = api.useUtils()
  const deleteEdge = api.edge.delete.useMutation({
    onSuccess: async () => {
      await utils.edge.invalidate()
    },
  })
  return (
    <button
      onClick={() => {
        deleteEdge.mutate({ edgeId: edge.id })
      }}
    >{`${edge.node1Id} - ${edge.node2Id}`}</button>
  )
}
