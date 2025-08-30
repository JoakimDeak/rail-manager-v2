'use client'

import { api } from '~/trpc/react'

import { AuthenticatorLinker } from './AuthenticatorLinker'
import { AuthenticatorUnlinker } from './AuthenticatorUnlinker'

export const AuthMenu = () => {
  const [user] = api.user.get.useSuspenseQuery()

  if (!user?.totp_verified) {
    return (
      <div
        className="w-fit self-center flex flex-col items-center gap-2 bg-white
          py-8 pt-6 px-8 outline outline-black"
      >
        <span>Get started by setting up 2fa</span>
        <AuthenticatorLinker />
      </div>
    )
  }

  return (
    <div className="w-full">
      <AuthenticatorUnlinker />
      {/* TODO: Add button for revoking refresh tokens */}
    </div>
  )
}
