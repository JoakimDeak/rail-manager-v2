import type { World as WorldType } from '@prisma/client'
import Link from 'next/link'
import { useRef, useState } from 'react'

import CheckIcon from '~/icons/check.svg'
import DeleteIcon from '~/icons/close.svg'
import EditIcon from '~/icons/edit.svg'
import LoadingSpinner from '~/icons/loading.svg'
import { api } from '~/trpc/react'

export const World = ({ world }: { world: WorldType }) => {
  const [name, setName] = useState('')
  const editToggleRef = useRef<HTMLInputElement>(null)

  const utils = api.useUtils()
  const deleteWorld = api.world.delete.useMutation({
    onSuccess: async () => {
      await utils.world.invalidate()
    },
  })
  const updateWorld = api.world.update.useMutation({
    onSuccess: async () => {
      await utils.world.invalidate()
      if (editToggleRef.current) {
        editToggleRef.current.checked = !editToggleRef.current.checked
      }
    },
  })

  return (
    <div className="group relative flex w-full flex-row justify-between gap-2">
      <div
        className="relative flex gap-2 grow group-has-checked:shadow-sharp
          min-w-0"
      >
        <Link
          href={`/${world.id}`}
          className="button-sm min-w-[186px] grow truncate whitespace-nowrap"
        >
          {world.name}
        </Link>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateWorld.mutate({ name, id: world.id })
          }}
          className="shadow-sharp absolute bottom-0 z-10 hidden size-4 h-auto
            w-full translate-y-full gap-2 bg-white px-2 py-1 pr-1 outline
            outline-black group-has-checked:flex"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-full min-w-0 placeholder-neutral-400 outline-none
              grow"
            placeholder="World name"
          />
          <button disabled={updateWorld.isPending} className="button-sm p-1">
            {updateWorld.isPending ? <LoadingSpinner /> : <CheckIcon />}
          </button>
        </form>
      </div>
      <div className="flex peer flex-row items-center gap-1">
        <label className="button-sm p-1">
          <EditIcon />
          <input className="hidden" type="checkbox" ref={editToggleRef} />
        </label>
        <button
          disabled={deleteWorld.isPending}
          className="button-sm p-1"
          onClick={() => {
            deleteWorld.mutate({ id: world.id })
          }}
        >
          {deleteWorld.isPending ? <LoadingSpinner /> : <DeleteIcon />}
        </button>
      </div>
    </div>
  )
}
