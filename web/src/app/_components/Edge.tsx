'use client'

import type { Edge as EdgeType } from '@prisma/client'
import { useRef, useState } from 'react'

import CheckIcon from '~/icons/check.svg'
import DeleteIcon from '~/icons/close.svg'
import EditIcon from '~/icons/edit.svg'
import LoadingSpinner from '~/icons/loading.svg'
import { api } from '~/trpc/react'

interface Props {
  edge: EdgeType & { node1: { name: string }; node2: { name: string } }
}

export const Edge = ({ edge }: Props) => {
  const [weight, setWeight] = useState(edge.weight)
  const editToggleRef = useRef<HTMLInputElement>(null)
  const weightEditRef = useRef<HTMLInputElement>(null)

  const utils = api.useUtils()
  const deleteEdge = api.edge.delete.useMutation({
    onSuccess: async () => {
      await utils.edge.invalidate()
    },
  })
  const updateEdge = api.edge.update.useMutation({
    onSuccess: async () => {
      await utils.edge.invalidate()
      if (editToggleRef.current) {
        editToggleRef.current.checked = !editToggleRef.current.checked
      }
    },
  })

  return (
    <div className="group flex w-full flex-row justify-between gap-2">
      <div className="relative flex gap-2 w-full">
        <span
          className="group-has-checked:shadow-sharp min-w-[186px] truncate px-2
            w-full py-1 whitespace-nowrap outline outline-black"
        >
          {`[${edge.node1.name} - ${edge.node2.name}] w:${edge.weight}`}
        </span>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateEdge.mutate({ edgeId: edge.id, weight })
          }}
          className="shadow-sharp justify-between absolute bottom-0 z-10 hidden
            size-4 h-auto w-full translate-y-full gap-2 bg-white px-2 py-1 pr-1
            outline outline-black group-has-checked:flex"
        >
          <input
            ref={weightEditRef}
            type="number"
            min={1}
            required
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="max-w-full grow min-w-0 placeholder-neutral-400
              outline-none"
            placeholder="Weight"
          />
          <button disabled={updateEdge.isPending} className="button-sm p-1">
            {updateEdge.isPending ? <LoadingSpinner /> : <CheckIcon />}
          </button>
        </form>
      </div>
      <div className="relative flex flex-row items-center gap-1">
        <label className="button-sm p-1">
          <EditIcon />
          <input
            className="hidden"
            type="checkbox"
            onChange={(e) => {
              if (e.target.checked) {
                weightEditRef.current?.focus()
              }
            }}
            ref={editToggleRef}
          />
        </label>
        <button
          disabled={deleteEdge.isPending}
          className="button-sm p-1"
          onClick={() => {
            deleteEdge.mutate({ edgeId: edge.id })
          }}
        >
          {deleteEdge.isPending ? <LoadingSpinner /> : <DeleteIcon />}
        </button>
      </div>
    </div>
  )
}
