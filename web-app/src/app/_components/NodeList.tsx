'use client'

import { useRef, useState } from 'react'

import AddIcon from '~/icons/add.svg'
import CheckIcon from '~/icons/check.svg'
import LoadingSpinner from '~/icons/loading.svg'
import { api } from '~/trpc/react'

import { Node } from './Node'

export const NodeList = ({ worldId }: { worldId: number }) => {
  const toggleRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')

  const [nodes] = api.node.getAll.useSuspenseQuery({ worldId })

  const utils = api.useUtils()
  const createNode = api.node.create.useMutation({
    onSuccess: async () => {
      await utils.node.invalidate()
      setName('')
      if (!toggleRef.current) {
        return
      }
      toggleRef.current.checked = !toggleRef.current.checked
    },
    // TODO: Add toast
  })

  return (
    <div
      className="shadow-sharp flex h-fit flex-col items-center gap-2 bg-white
        min-w-[278.5px] px-3 py-4 outline outline-black"
    >
      <div
        className="peer flex w-full flex-row items-center justify-between gap-4"
      >
        <span className="pl-1">Nodes</span>
        <label className="group">
          <input type="checkbox" className="peer hidden" ref={toggleRef} />
          <div className="button-sm p-1 outline-transparent hover:outline-black">
            <AddIcon
              className="transition-transform group-has-checked:rotate-45"
            />
          </div>
        </label>
      </div>
      <div className="h-px w-full bg-black" />
      {nodes?.map((node) => (
        <Node node={node} key={node.id} />
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (createNode.isPending) {
            return
          }
          createNode.mutate({ name, worldId })
        }}
        className="hidden items-center gap-2 outline-black w-full
          justify-between peer-has-checked:flex"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          pattern=".+"
          placeholder="Node Name"
          className="shadow-sharp-sm grow px-2 py-1 outline outline-black
            placeholder:text-neutral-400"
        />
        <button disabled={createNode.isPending} className="button-sm p-1">
          {createNode.isPending ? <LoadingSpinner /> : <CheckIcon />}
        </button>
      </form>
    </div>
  )
}
