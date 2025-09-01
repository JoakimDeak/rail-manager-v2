'use client'

import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import QRCode from 'react-qr-code'

import CheckIcon from '~/icons/check.svg'
import ErrorIcon from '~/icons/error.svg'
import Spinner from '~/icons/loading.svg'
import { AUTHENTICATOR_CODE_DIGITS } from '~/server/api/auth'
import { api } from '~/trpc/react'
import cn from '~/utils/cn'

export const AuthenticatorLinker = () => {
  const utils = api.useUtils()
  const link = api.auth.link.useMutation()
  const validate = api.auth.validate.useMutation({
    onSuccess: async () => {
      toast.success('Authenticator was linked')
      await utils.user.invalidate()
    },
    onError: (e) => {
      toast.error(e.message)
    },
  })
  const { register, handleSubmit, setFocus, watch, subscribe } = useForm<{
    code: string
  }>({ defaultValues: { code: '' } })

  subscribe({
    name: 'code',
    callback: () => {
      validate.reset()
    },
  })

  if (validate.isSuccess) {
    return null
  }

  return (
    <div className="flex flex-col gap-2 w-fit">
      {!!link.data ? (
        <div className="flex gap-4 flex-col items-center">
          <div className="">
            <QRCode value={link.data} />
          </div>
          <form
            onSubmit={handleSubmit(({ code }) => {
              validate.mutate({ code })
            })}
            className="w-full flex flex-row group gap-2 max-w-[272px]"
          >
            <div className="grid gap-2 w-full grid-flow-col auto-cols-fr">
              {Array.from({ length: AUTHENTICATOR_CODE_DIGITS }).map((_, i) => (
                <span
                  onClick={() => setFocus('code')}
                  key={i}
                  className="bg-white outline outline-black shadow-sharp-sm grid
                    place-items-center"
                >
                  {watch('code')?.[i]}
                  <div
                    className={cn(
                      'hidden w-px bg-black h-5 animate-blink',
                      watch('code')?.length === i && 'group-focus-within:block',
                    )}
                  />
                </span>
              ))}
            </div>
            <input
              {...register('code')}
              maxLength={AUTHENTICATOR_CODE_DIGITS}
              autoFocus
              className="sr-only"
            />
            <button className="button-sm p-2">
              {(() => {
                switch (validate.status) {
                  case 'error':
                    return <ErrorIcon />
                  case 'pending':
                    return <Spinner />
                  case 'idle':
                    return <CheckIcon />
                }
              })()}
            </button>
          </form>
        </div>
      ) : (
        <button onClick={() => link.mutate()} className="button">
          Setup linking key
        </button>
      )}
    </div>
  )
}
