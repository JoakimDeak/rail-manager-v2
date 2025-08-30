import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import CloseIcon from '~/icons/close.svg'
import Spinner from '~/icons/loading.svg'
import { api } from '~/trpc/react'
import cn from '~/utils/cn'

export const AuthenticatorUnlinker = () => {
  const utils = api.useUtils()
  const unlink = api.auth.unlink.useMutation({
    onSuccess: async () => {
      dialogRef.current?.close()
      toast.success('Authenticator was unlinked')
      await utils.user.invalidate()
    },
    onError: (e) => {
      toast.error(e.message)
    },
  })

  const { register, watch, setFocus, handleSubmit, reset } = useForm<{
    code: string
  }>({
    defaultValues: { code: '' },
  })

  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const controller = new AbortController()
    dialogRef.current?.addEventListener(
      'close',
      () => {
        reset()
      },
      { signal: controller.signal },
    )

    return () => {
      controller.abort()
    }
  })

  return (
    <div
      className="flex flex-row gap-2 items-center bg-white w-fit py-2 px-2
        justify-start"
    >
      <button
        onClick={() => {
          dialogRef.current?.showModal()
          setFocus('code')
        }}
        className="button-sm"
      >
        Unlink authenticator
      </button>
      <dialog
        className="size-full bg-transparent open:grid place-items-center
          max-w-screen max-h-screen p-8"
        ref={dialogRef}
        onMouseDown={(e) => {
          if (e.target === dialogRef.current) {
            dialogRef.current?.close()
          }
        }}
      >
        <div
          className="outline outline-black shadow-sharp flex flex-col gap-4
            items-center bg-white"
        >
          <div
            className="flex flex-row justify-between border-b border-black
              w-full items-center"
          >
            <h1 className="px-4">Unlink Authenticator?</h1>
            <button
              onClick={() => {
                dialogRef.current?.close()
              }}
              className="p-2 outline outline-black cursor-pointer"
            >
              <CloseIcon />
            </button>
          </div>

          <form
            onSubmit={handleSubmit(({ code }) => unlink.mutate({ code }))}
            className="px-4 pb-4 w-full flex flex-col gap-2"
          >
            <div className="group grid grid-cols-6 gap-2 w-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  onClick={() => setFocus('code')}
                  key={i}
                  className="bg-white outline outline-black shadow-sharp-sm grid
                    place-items-center min-h-10"
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
              <input
                {...register('code')}
                maxLength={6}
                autoFocus
                className="sr-only"
              />
            </div>
            <button className="button w-full mt-2 grid place-items-center">
              {unlink.isPending ? <Spinner /> : 'Confirm'}
            </button>
          </form>
        </div>
      </dialog>
    </div>
  )
}
