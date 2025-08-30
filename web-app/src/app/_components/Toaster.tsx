import { Toaster as _Toaster } from 'react-hot-toast'

export const Toaster = () => {
  return (
    <_Toaster
      toastOptions={{
        style: {
          borderRadius: 0,
          outlineWidth: 1,
          outlineStyle: 'solid',
          padding: '8px 16px',
          maxWidth: '50vw',
        },
        position: 'bottom-center',
        icon: null,
        error: {
          style: {
            outlineColor: 'var(--color-red-500)',
            boxShadow: '4px 4px 0 var(--color-red-500)',
          },
        },
        success: {
          style: {
            outlineColor: 'var(--color-green-500)',
            boxShadow: '4px 4px 0 var(--color-green-500)',
          },
        },
      }}
    />
  )
}
