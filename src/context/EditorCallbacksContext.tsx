import { createContext, useContext } from 'react'
import type { SavedSignature } from '../lib/signatureApi'

export interface EditorCallbacksValue {
  onLogoSave: (file: File) => void
  onSignatureSave: (file: File) => void
  savedSignatures: SavedSignature[]
  signatureLimit: number
  signatureCount: number
  refreshSignatures: () => void
}

const noop = () => { /* no-op outside editor */ }

export const EditorCallbacksContext = createContext<EditorCallbacksValue>({
  onLogoSave: noop,
  onSignatureSave: noop,
  savedSignatures: [],
  signatureLimit: 1,
  signatureCount: 0,
  refreshSignatures: noop,
})

export function useEditorCallbacks(): EditorCallbacksValue {
  return useContext(EditorCallbacksContext)
}
