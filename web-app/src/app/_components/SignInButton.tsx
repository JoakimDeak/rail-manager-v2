import Link from 'next/link'
import { auth } from '~/server/auth'
import cn from '~/utils/cn'

export const SignInButton = async () => {
  const session = await auth()
  if (session) {
    return null
  }

  return (
    <Link
      href="api/auth/signin"
      className={cn(
        'button',
        session && 'absolute top-2 right-2 flex flex-row gap-2 pr-2',
      )}
    >
      Sign in
    </Link>
  )
}
