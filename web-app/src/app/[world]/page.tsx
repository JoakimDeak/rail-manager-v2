import { redirect } from 'next/navigation'
import { auth } from '~/server/auth'
import { api } from '~/trpc/server'

import { NodeList } from '../_components/NodeList'
import { WorldDropdown } from '../_components/WorldDropdown'
import { SignOutButton } from '../_components/SignOutButton'
import Link from 'next/link'
import { EdgeList } from '../_components/EdgeList'

export default async function Home({
  params,
}: {
  params: Promise<{ world: string }>
}) {
  const session = await auth()
  if (!session) {
    redirect('api/auth/signin')
  }
  const worldId = (await params).world
  const world = await api.world.get({ id: Number(worldId) })

  if (!world) {
    redirect('/')
  }

  return (
    <>
      <nav className="sticky inset-x-0 top-0 mb-4 flex w-full justify-between p-2">
        <Link href="/" className="button self-start font-black underline">
          Rail Manager v2
        </Link>
        <div className="flex flex-row gap-4">
          <WorldDropdown selectedWorld={world} />
          <SignOutButton />
        </div>
      </nav>
      <main className="flex w-full justify-center gap-8">
        <div className="flex flex-row gap-8">
          <NodeList worldId={world.id} />
          <EdgeList worldId={world.id} />
        </div>
      </main>
    </>
  )
}
