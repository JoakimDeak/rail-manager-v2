'use client'

import { useRef } from 'react'
import { api } from '~/trpc/react'
import AddIcon from '~/icons/add.svg'
import { Edge } from './Edge'
import CheckIcon from '~/icons/check.svg'
import LoadingSpinner from '~/icons/loading.svg'
import ChevronRight from '~/icons/chevron-right.svg'
import { useForm } from 'react-hook-form'

interface Props {
  worldId: number
}

export const EdgeList = ({ worldId }: Props) => {
  const toggleRef = useRef<HTMLInputElement>(null)

  const [edges] = api.edge.getAll.useSuspenseQuery({ worldId })
  const [nodes] = api.node.getAll.useSuspenseQuery({ worldId })

  const { register, handleSubmit, resetField } = useForm<{
    node1Id: number
    node2Id: number
    weight: number
  }>()

  const utils = api.useUtils()
  const createEdge = api.edge.create.useMutation({
    onSuccess: async () => {
      await utils.edge.invalidate()

      resetField('weight')
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
        min-w-[237px] px-3 py-4 outline outline-black"
    >
      <div
        className="peer flex w-full flex-row items-center justify-between gap-4"
      >
        <span className="pl-1">Edges</span>
        <label className="group">
          <input type="checkbox" className="hidden" ref={toggleRef} />
          <div className="button-sm p-1 outline-transparent hover:outline-black">
            <AddIcon
              className="transition-transform group-has-checked:rotate-45"
            />
          </div>
        </label>
      </div>
      <div className="h-px w-full bg-black" />
      {edges?.map((edge) => (
        <Edge edge={edge} key={edge.id} />
      ))}
      <form
        onSubmit={handleSubmit((data) => {
          createEdge.mutate({
            ...data,
            worldId,
          })
        })}
        className="hidden items-center gap-2 outline-black w-full
          peer-has-checked:flex"
      >
        <div className="group relative">
          <select
            className="button-sm appearance-none pr-8 open:translate-0.5
              open:shadow-none"
            {...register('node1Id', { valueAsNumber: true })}
          >
            {nodes?.map((world) => (
              <option key={world.id} value={world.id}>
                {world.name}
              </option>
            ))}
          </select>
          <ChevronRight
            className="pointer-events-none absolute top-1/2 right-1
              -translate-y-1/2 rotate-90 transition-transform
              group-has-open:translate-x-[2px]
              group-has-open:translate-y-[calc(-50%_+_2px)]
              group-has-open:-scale-x-100"
          />
        </div>
        <div className="group relative">
          <select
            className="button-sm appearance-none pr-8 open:translate-0.5
              open:shadow-none"
            {...register('node2Id', { valueAsNumber: true })}
          >
            {nodes?.map((world) => (
              <option key={world.id} value={world.id}>
                {world.name}
              </option>
            ))}
          </select>
          <ChevronRight
            className="pointer-events-none absolute top-1/2 right-1
              -translate-y-1/2 rotate-90 transition-transform
              group-has-open:translate-x-[2px]
              group-has-open:translate-y-[calc(-50%_+_2px)]
              group-has-open:-scale-x-100"
          />
        </div>
        <input
          {...register('weight', { valueAsNumber: true })}
          type="number"
          placeholder="Weight"
          className="hover:shadow-sharp-sm w-[8ch] grow appearance-none px-2
            py-1 placeholder-neutral-400 outline outline-black"
        />
        <button disabled={createEdge.isPending} className="button-sm p-1">
          {createEdge.isPending ? <LoadingSpinner /> : <CheckIcon />}
        </button>
      </form>
    </div>
  )
}
