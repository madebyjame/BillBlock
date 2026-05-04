import type { DocumentData, LineItem, DocumentSettings } from '../types/document'
import { defaultDocument, SIGNATURE_PRESETS } from '../types/document'
import { generateId } from '../utils/idGenerator'

export type DocumentAction =
  | { type: 'UPDATE_COMPANY';    data: Partial<DocumentData['company']> }
  | { type: 'UPDATE_DOC_META';   data: Partial<DocumentData['docMeta']> }
  | { type: 'UPDATE_CUSTOMER';   data: Partial<DocumentData['customer']> }
  | { type: 'ADD_ITEM' }
  | { type: 'REMOVE_ITEM';       id: string }
  | { type: 'UPDATE_ITEM';       id: string; field: keyof LineItem; value: string | number }
  | { type: 'FILL_ITEM';         id: string; data: Partial<LineItem> }  // autocomplete fill
  | { type: 'REORDER_ITEMS';     ids: string[] }                         // drag & drop
  | { type: 'UPDATE_NOTES';      notes: string }
  | { type: 'UPDATE_SUMMARY';    data: Partial<DocumentData['summary']> }
  | { type: 'UPDATE_FOOTER';     data: Partial<DocumentData['footer']> }
  | { type: 'UPDATE_SETTINGS';   data: Partial<DocumentSettings> }
  | { type: 'TOGGLE_VISIBILITY'; path: string }
  | { type: 'LOAD_DOCUMENT';     doc: DocumentData }

export function documentReducer(state: DocumentData, action: DocumentAction): DocumentData {
  switch (action.type) {
    case 'UPDATE_COMPANY':
      return { ...state, company: { ...state.company, ...action.data } }
    case 'UPDATE_DOC_META': {
      const newMeta = { ...state.docMeta, ...action.data }
      // เมื่อเปลี่ยนประเภทเอกสาร ให้อัปเดต signature labels อัตโนมัติ
      if (action.data.documentType && action.data.documentType !== state.docMeta.documentType) {
        const preset = SIGNATURE_PRESETS[action.data.documentType]
        if (preset) {
          return {
            ...state,
            docMeta: newMeta,
            footer: {
              ...state.footer,
              sellerLabel: preset.sellerLabel,
              approverName: preset.approverName,
              buyerLabel: preset.buyerLabel,
              buyerTitle: preset.buyerTitle,
            },
            visibility: {
              ...state.visibility,
              footer: { ...state.visibility.footer, buyerSignature: preset.showBuyerSignature },
            },
          }
        }
      }
      return { ...state, docMeta: newMeta }
    }
    case 'UPDATE_CUSTOMER':
      return { ...state, customer: { ...state.customer, ...action.data } }
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, {
          id: generateId(), description: '', detail: '', quantity: 1,
          unit: 'ชิ้น', unitPrice: 0, discount: 0, discountType: 'percent',
        }],
      }
    case 'REMOVE_ITEM':
      return state.items.length <= 1 ? state : { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'UPDATE_ITEM':
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, [action.field]: action.value } : i) }
    case 'FILL_ITEM':
      return { ...state, items: state.items.map(i => i.id === action.id ? { ...i, ...action.data } : i) }
    case 'REORDER_ITEMS': {
      const map = new Map(state.items.map(i => [i.id, i]))
      return { ...state, items: action.ids.map(id => map.get(id)!).filter(Boolean) }
    }
    case 'UPDATE_NOTES':
      return { ...state, notes: action.notes }
    case 'UPDATE_SUMMARY':
      return { ...state, summary: { ...state.summary, ...action.data } }
    case 'UPDATE_FOOTER':
      return { ...state, footer: { ...state.footer, ...action.data } }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.data } }
    case 'TOGGLE_VISIBILITY': {
      const [section, field] = action.path.split('.') as [keyof DocumentData['visibility'], string]
      const sectionObj = state.visibility[section] as Record<string, boolean>
      return { ...state, visibility: { ...state.visibility, [section]: { ...sectionObj, [field]: !sectionObj[field] } } }
    }
    case 'LOAD_DOCUMENT':
      return action.doc
    default:
      return state
  }
}

export { defaultDocument }
