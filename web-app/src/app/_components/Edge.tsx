'use client'

import type { Edge as EdgeType } from '@prisma/client'
import { api } from '~/trpc/react'

interface Props {
  edge: EdgeType & { node1: { name: string }; node2: { name: string } }
}

export const Edge = ({ edge }: Props) => {
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
    >{`${edge.node1.name} - ${edge.node2.name}`}</button>
  )
}
