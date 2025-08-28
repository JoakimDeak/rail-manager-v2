import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '~/server/auth'
import { api, HydrateClient } from '~/trpc/server'

import { SignOutButton } from './_components/SignOutButton'
import { WorldList } from './_components/WorldList'

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect('api/auth/signin')
  }

  void api.world.getAll.prefetch()

  // TODO: Fix layout for <600px
  return (
    <HydrateClient>
      <nav
        className="sticky inset-x-0 top-0 mb-4 flex w-full justify-between p-2"
      >
        <Link href="/" className="button font-black">
          Rail Manager v2
        </Link>
        <SignOutButton />
      </nav>
      <main className="flex w-full justify-center pb-[20vh]">
        <WorldList />
      </main>
    </HydrateClient>
  )
}
