import { redirect } from 'next/navigation'
import { auth } from '~/server/auth'
import { api, HydrateClient } from '~/trpc/server'
import { SideBar } from '../_components/SideBar'
import { CreateNodeButton } from '../_components/CreateNodeButton'
import { NodeList } from '../_components/NodeList'
import { CreateEdgeButton } from '../_components/CreateEdgeButton'
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

  void api.node.getAll.prefetch({ worldId: world.id })

  return (
    <HydrateClient>
      <main className="grid min-h-screen grid-cols-[1fr_min-content] justify-between">
        <div>
          <CreateNodeButton worldId={world.id} />
          <NodeList worldId={world.id} />
          <CreateEdgeButton worldId={world.id} />
          <EdgeList worldId={world.id} />
        </div>
        <SideBar />
      </main>
    </HydrateClient>
  )
}
