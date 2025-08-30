import Link from 'next/link'

import KeyIcon from '~/icons/key.svg'
import { api, HydrateClient } from '~/trpc/server'

import { AuthMenu } from '../_components/AuthMenu'
import { SignOutButton } from '../_components/SignOutButton'

export default async function Home() {
  void api.user.get.prefetch()

  return (
    <HydrateClient>
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
      <main className="flex flex-col w-full pb-[20vh] px-8">
        <AuthMenu />
      </main>
    </HydrateClient>
  )
}
