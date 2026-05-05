import { useEffect, useRef, useState } from 'react'
import type { DocumentData } from '../types/document'
import { updateDocument } from '../lib/documentApi'

export function useCloudAutoSave(docId: string | undefined, doc: DocumentData) {
  const [status, setStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // ถ้าไม่มี UUID จริง (new / local) ไม่ต้อง save ขึ้น cloud
    if (!docId || docId === 'new' || docId === 'local') return
    if (isFirstRender.current) { isFirstRender.current = false; return }

    setStatus('unsaved')
    clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setStatus('saving')
      updateDocument(docId, doc)
        .then(() => setStatus('saved'))
        .catch(() => setStatus('unsaved'))
    }, 1200)

    return () => clearTimeout(timerRef.current)
  }, [docId, doc])

  return status
}
