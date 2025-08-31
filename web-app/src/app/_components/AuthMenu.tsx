'use client'

import { api } from '~/trpc/react'

import { AuthenticatorLinker } from './AuthenticatorLinker'
import { AuthenticatorUnlinker } from './AuthenticatorUnlinker'
import { RefreshTokenRevoker } from './RefreshTokenRevoker'

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
    <div className="flex flex-col gap-2 w-fit self-center">
      <span className="outline outline-black py-1 px-2 bg-white w-fit">{`Email: ${user.email}`}</span>
      <RefreshTokenRevoker />
      <AuthenticatorUnlinker />
    </div>
  )
}
