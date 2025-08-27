'use client'

import AddIcon from '~/icons/add.svg'

import { useRef, useState } from 'react'
import CheckIcon from '~/icons/check.svg'
import LoadingSpinner from '~/icons/loading.svg'
import { api } from '~/trpc/react'
import { World } from './World'

// Move to center for / and move to nav as dropdown for /[world]
export const WorldList = () => {
  const { data: worlds } = api.world.getAll.useQuery()
  const [name, setName] = useState('')

  const toggleRef = useRef<HTMLInputElement>(null)
  const utils = api.useUtils()
  const createWorld = api.world.create.useMutation({
    onSuccess: async () => {
      await utils.world.invalidate()
      setName('')
      if (!toggleRef.current) {
        return
      }
      toggleRef.current.checked = !toggleRef.current.checked
    },
    // TODO: Add toast
  })

  return (
    <div className="group shadow-sharp flex w-[264px] flex-col items-center gap-2 bg-white px-3 py-4 outline outline-black">
      <div className="flex w-full flex-row items-center justify-between gap-4">
        <span className="pl-1">Worlds</span>
        <label>
          <input type="checkbox" className="peer hidden" ref={toggleRef} />
          <div className="button-sm p-1 outline-transparent hover:outline-black">
            <AddIcon className="transition-transform group-has-checked:rotate-45" />
          </div>
        </label>
      </div>
      <div className="h-px w-full bg-black" />
      {worlds?.map((world) => (
        <World world={world} key={world.id} />
      ))}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (createWorld.isPending) {
            return
          }
          createWorld.mutate({ name })
        }}
        className="hidden items-center gap-2 outline-black group-has-checked:flex"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          pattern=".+"
          placeholder="World Name"
          className="shadow-sharp-sm w-[200px] px-2 py-1 outline outline-black placeholder:text-neutral-400"
        />
        <button disabled={createWorld.isPending} className="button-sm p-1">
          {createWorld.isPending ? <LoadingSpinner /> : <CheckIcon />}
        </button>
      </form>
    </div>
  )
}
