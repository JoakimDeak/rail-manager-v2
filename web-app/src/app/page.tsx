import { redirect } from 'next/navigation'
import { auth } from '~/server/auth'
import { api, HydrateClient } from '~/trpc/server'
import { SideBar } from './_components/SideBar'

export default async function Home() {
  const session = await auth()

  if (!session) {
    redirect('api/auth/signin')
  }

  void api.world.getAll.prefetch()

  return (
    <HydrateClient>
      <main className="grid min-h-screen grid-cols-[1fr_min-content] justify-between">
        <div className=""></div>
        <SideBar />
      </main>
    </HydrateClient>
  )
}
