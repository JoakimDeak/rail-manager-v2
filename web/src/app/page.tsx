import Link from 'next/link'
import { redirect } from 'next/navigation'

import KeyIcon from '~/icons/key.svg'
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

  return (
    <HydrateClient>
      {/* TODO: Make nav a proper component */}
      <nav
        className="sticky inset-x-0 top-0 mb-4 flex w-full justify-between p-2"
      >
        <Link href="/" className="button font-black">
          Rail Manager v2
        </Link>
        <div className="flex flex-row gap-4">
          <Link className="button p-2" href="/linking">
            <KeyIcon />
          </Link>
          <SignOutButton />
        </div>
      </nav>
      <main className="flex w-full justify-center pb-[20vh]">
        <WorldList />
      </main>
    </HydrateClient>
  )
}
