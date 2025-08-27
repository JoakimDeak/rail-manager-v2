'use client'

import { useRef } from 'react'
import { api } from '~/trpc/react'
import AddIcon from '~/icons/add.svg'
import { Edge } from './Edge'
import CheckIcon from '~/icons/check.svg'
import LoadingSpinner from '~/icons/loading.svg'
import ChevronRight from '~/icons/chevron-right.svg'

export const EdgeList = ({ worldId }: { worldId: number }) => {
  const { data: nodes } = api.node.getAll.useQuery({ worldId })
  const { data: edges } = api.edge.getAll.useQuery({ worldId })
  const toggleRef = useRef<HTMLInputElement>(null)

  const utils = api.useUtils()
  const createEdge = api.edge.create.useMutation({
    onSuccess: async () => {
      await utils.edge.invalidate()

      if (!toggleRef.current) {
        return
      }
      toggleRef.current.checked = !toggleRef.current.checked
    },
    // TODO: Add toast
  })

  return (
    <div className="group shadow-sharp flex h-fit flex-col items-center gap-2 bg-white px-3 py-4 outline outline-black">
      <div className="flex w-full flex-row items-center justify-between gap-4">
        <span className="pl-1">Edges</span>
        <label>
          <input type="checkbox" className="peer hidden" ref={toggleRef} />
          <div className="button-sm p-1 outline-transparent hover:outline-black">
            <AddIcon className="transition-transform group-has-checked:rotate-45" />
          </div>
        </label>
      </div>
      <div className="h-px w-full bg-black" />
      {edges?.map((edge) => (
        <Edge edge={edge} key={edge.id} />
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (createEdge.isPending) {
            return
          }
          // createEdge.mutate({ name, worldId })
        }}
        className="hidden items-center gap-2 outline-black group-has-checked:flex"
      >
        <div className="group relative">
          <select className="button-sm appearance-none pr-8 open:translate-0.5 open:shadow-none">
            {nodes?.map((world) => (
              <option key={world.id} value={world.id}>
                {world.name}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 rotate-90 transition-transform group-has-open:-scale-x-100" />
        </div>
        <div className="group relative">
          <select className="button-sm appearance-none pr-8 open:translate-0.5 open:shadow-none">
            {nodes?.map((world) => (
              <option key={world.id} value={world.id}>
                {world.name}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute top-1/2 right-1 -translate-y-1/2 rotate-90 transition-transform group-has-open:-scale-x-100" />
        </div>
        <input
          pattern="\d+"
          type="number"
          placeholder="Weight"
          className="hover:shadow-sharp-sm w-[8ch] appearance-none px-2 py-1 placeholder-neutral-400 outline outline-black"
        />
        <button disabled={createEdge.isPending} className="button-sm p-1">
          {createEdge.isPending ? <LoadingSpinner /> : <CheckIcon />}
        </button>
      </form>
    </div>
  )
}
