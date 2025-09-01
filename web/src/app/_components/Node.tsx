import type { Node as NodeType } from '@prisma/client'
import { useRef, useState } from 'react'

import CheckIcon from '~/icons/check.svg'
import DeleteIcon from '~/icons/close.svg'
import EditIcon from '~/icons/edit.svg'
import LoadingSpinner from '~/icons/loading.svg'
import { api } from '~/trpc/react'

export const Node = ({ node }: { node: NodeType }) => {
  const [name, setName] = useState(node.name)
  const editToggleRef = useRef<HTMLInputElement>(null)
  const nameEditRef = useRef<HTMLInputElement>(null)

  const utils = api.useUtils()
  const deleteNode = api.node.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.node.invalidate(), utils.edge.invalidate()])
    },
  })
  const updateNode = api.node.update.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.edge.invalidate(), utils.node.invalidate()])

      if (editToggleRef.current) {
        editToggleRef.current.checked = !editToggleRef.current.checked
      }
    },
  })

  return (
    <div className="group flex w-full flex-row justify-between gap-2">
      <div className="relative flex gap-2 min-w-0">
        <span
          className="group-has-checked:shadow-sharp min-w-[186px] grow truncate
            px-2 py-1 whitespace-nowrap outline outline-black"
        >
          {node.name}
        </span>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateNode.mutate({ name, nodeId: node.id })
          }}
          className="shadow-sharp absolute bottom-0 z-10 hidden size-4 h-auto
            w-full translate-y-full gap-2 bg-white px-2 py-1 pr-1 outline
            outline-black group-has-checked:flex"
        >
          <input
            ref={nameEditRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-full min-w-0 placeholder-neutral-400 outline-none"
            placeholder="Node name"
          />
          <button disabled={updateNode.isPending} className="button-sm p-1">
            {updateNode.isPending ? <LoadingSpinner /> : <CheckIcon />}
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
              console.log('toggle')
              if (e.target.checked) {
                nameEditRef.current?.focus()
              }
            }}
            ref={editToggleRef}
          />
        </label>
        <button
          disabled={deleteNode.isPending}
          className="button-sm p-1"
          onClick={() => {
            deleteNode.mutate({ nodeId: node.id })
          }}
        >
          {deleteNode.isPending ? <LoadingSpinner /> : <DeleteIcon />}
        </button>
      </div>
    </div>
  )
}
