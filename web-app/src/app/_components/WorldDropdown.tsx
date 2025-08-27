'use client'

import type { World } from '@prisma/client'
import { redirect } from 'next/navigation'
import { useRef } from 'react'

import ChevronRight from '~/icons/chevron-right.svg'
import { api } from '~/trpc/react'

export const WorldDropdown = ({ selectedWorld }: { selectedWorld: World }) => {
  const selectRef = useRef<HTMLSelectElement>(null)
  const [worlds] = api.world.getAll.useSuspenseQuery()

  return (
    <div className="group relative">
      <select
        ref={selectRef}
        onChange={(e) => {
          redirect(`/${e.target.value}`)
        }}
        className="button appearance-none pr-10 open:translate-0.5
          open:shadow-none"
        defaultValue={selectedWorld?.id}
      >
        {worlds?.map((world) => (
          <option key={world.id} value={world.id}>
            {world.name}
          </option>
        ))}
      </select>
      <ChevronRight
        className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2
          rotate-90 transition-transform group-has-open:-scale-x-100"
      />
    </div>
  )
}
