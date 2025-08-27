import Image from 'next/image'
import Link from 'next/link'
import { auth } from '~/server/auth'

export const SignOutButton = async () => {
  const session = await auth()

  if (!session) {
    return null
  }

  return (
    <Link
      href="api/auth/signout"
      className="button flex w-fit flex-row gap-2 pr-2"
    >
      <span>Sign out</span>
      {session?.user.image && (
        <>
          <div className="w-px bg-black" />
          <Image
            src={session.user.image}
            alt="profile picture"
            width={24}
            height={24}
          />
        </>
      )}
    </Link>
  )
}
