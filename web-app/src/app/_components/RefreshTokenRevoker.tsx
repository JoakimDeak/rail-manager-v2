import toast from 'react-hot-toast'

import RevokeIcon from '~/icons/revoke.svg'
import { api } from '~/trpc/react'

export const RefreshTokenRevoker = () => {
  const rotate = api.auth.rotateRefreshToken.useMutation({
    onSuccess: () => {
      toast.success('Your refresh token has been revoked')
    },
  })

  return (
    <div className="flex gap-2 bg-white w-full">
      <span
        className="outline outline-black py-1 px-2 grow grid place-items-center"
      >
        Revoke refresh token
      </span>
      <button className="button-sm p-1" onClick={() => rotate.mutate()}>
        <RevokeIcon />
      </button>
    </div>
  )
}
