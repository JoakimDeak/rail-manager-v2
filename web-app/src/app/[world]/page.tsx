import Link from 'next/link'
import { redirect } from 'next/navigation'

import { auth } from '~/server/auth'
import { api, HydrateClient } from '~/trpc/server'

import { EdgeList } from '../_components/EdgeList'
import { NodeList } from '../_components/NodeList'
import { SignOutButton } from '../_components/SignOutButton'
import { WorldDropdown } from '../_components/WorldDropdown'

export default async function Home({
  params,
}: {
  params: Promise<{ world: string }>
}) {
  const session = await auth()
  if (!session) {
    redirect('api/auth/signin')
  }

  const awaitedParams = await params
  const worldId = Number(awaitedParams.world)
  const world = await api.world.get({ id: worldId })

  if (!world) {
    redirect('/')
  }

  void api.world.getAll.prefetch()
  void api.node.getAll.prefetch({ worldId })
  void api.edge.getAll.prefetch({ worldId })

  return (
    <HydrateClient>
      <nav
        className="sticky inset-x-0 top-0 mb-4 gap-4 flex w-full justify-between
          p-2"
      >
        <Link
          href="/"
          className="button self-start font-black underline whitespace-nowrap"
        >
          Rail Manager v2
        </Link>
        <div className="flex flex-row gap-4">
          <WorldDropdown selectedWorld={world} />
          <SignOutButton />
        </div>
      </nav>
      <main className="flex w-full justify-center gap-8 px-8">
        <div className="flex flex-row gap-8 flex-wrap justify-center">
          <NodeList worldId={world.id} />
          <EdgeList worldId={world.id} />
        </div>
      </main>
    </HydrateClient>
  )
}
