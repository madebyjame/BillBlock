import { useState, useCallback } from 'react'
import type { ConfirmOptions } from '../components/ConfirmDialog'

type PendingConfirm = ConfirmOptions & { resolve: (v: boolean) => void }

export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback(
    (opts: ConfirmOptions | string): Promise<boolean> =>
      new Promise((resolve) => {
        setPending({
          ...(typeof opts === 'string' ? { message: opts } : opts),
          resolve,
        })
      }),
    [],
  )

  const onConfirm = useCallback(() => {
    pending?.resolve(true)
    setPending(null)
  }, [pending])

  const onCancel = useCallback(() => {
    pending?.resolve(false)
    setPending(null)
  }, [pending])

  return { confirm, pending, onConfirm, onCancel }
}
