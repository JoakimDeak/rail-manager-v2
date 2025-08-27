import type { World as WorldType } from '@prisma/client'
import { api } from '~/trpc/react'
import DeleteIcon from '~/icons/close.svg'
import LoadingSpinner from '~/icons/loading.svg'
import EditIcon from '~/icons/edit.svg'
import Link from 'next/link'

export const World = ({ world }: { world: WorldType }) => {
  const utils = api.useUtils()
  const deleteWorld = api.world.delete.useMutation({
    onSuccess: async () => {
      await utils.world.invalidate()
    },
  })
  return (
    <div className="relative flex w-full flex-row justify-between gap-2">
      <Link
        href={`/${world.id}`}
        className="button-sm min-w-36 grow truncate whitespace-nowrap"
      >
        {world.name}
      </Link>
      <div className="flex flex-row items-center gap-1">
        <button className="button-sm p-1" disabled={deleteWorld.isPending}>
          <EditIcon />
        </button>
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
