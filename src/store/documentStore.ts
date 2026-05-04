import type { DocumentData, LineItem } from '../types/document'
import { defaultDocument } from '../types/document'
import { generateId } from '../utils/idGenerator'

export type DocumentAction =
  | { type: 'UPDATE_COMPANY';     data: Partial<DocumentData['company']> }
  | { type: 'UPDATE_DOC_META';    data: Partial<DocumentData['docMeta']> }
  | { type: 'UPDATE_CUSTOMER';    data: Partial<DocumentData['customer']> }
  | { type: 'UPDATE_ITEMS';       items: LineItem[] }
  | { type: 'ADD_ITEM' }
  | { type: 'REMOVE_ITEM';        id: string }
  | { type: 'UPDATE_ITEM';        id: string; field: keyof LineItem; value: string | number }
  | { type: 'UPDATE_NOTES';       notes: string }
  | { type: 'UPDATE_SUMMARY';     data: Partial<DocumentData['summary']> }
  | { type: 'UPDATE_FOOTER';      data: Partial<DocumentData['footer']> }
  | { type: 'TOGGLE_VISIBILITY';  path: string }  // dot-notation เช่น "header.taxId"

export function documentReducer(state: DocumentData, action: DocumentAction): DocumentData {
  switch (action.type) {
    case 'UPDATE_COMPANY':
      return { ...state, company: { ...state.company, ...action.data } }

    case 'UPDATE_DOC_META':
      return { ...state, docMeta: { ...state.docMeta, ...action.data } }

    case 'UPDATE_CUSTOMER':
      return { ...state, customer: { ...state.customer, ...action.data } }

    case 'UPDATE_ITEMS':
      return { ...state, items: action.items }

    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, { id: generateId(), description: '', detail: '', quantity: 1, unit: 'ชิ้น', unitPrice: 0, discount: 0 }],
      }

    case 'REMOVE_ITEM':
      if (state.items.length <= 1) return state
      return { ...state, items: state.items.filter(i => i.id !== action.id) }

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(i => i.id === action.id ? { ...i, [action.field]: action.value } : i),
      }

    case 'UPDATE_NOTES':
      return { ...state, notes: action.notes }

    case 'UPDATE_SUMMARY':
      return { ...state, summary: { ...state.summary, ...action.data } }

    case 'UPDATE_FOOTER':
      return { ...state, footer: { ...state.footer, ...action.data } }

    case 'TOGGLE_VISIBILITY': {
      // แยก path เช่น "header.taxId" เป็น section + field
      const [section, field] = action.path.split('.') as [
        keyof DocumentData['visibility'],
        string
      ]
      const sectionObj = state.visibility[section] as Record<string, boolean>
      return {
        ...state,
        visibility: {
          ...state.visibility,
          [section]: { ...sectionObj, [field]: !sectionObj[field] },
        },
      }
    }

    default:
      return state
  }
}

export { defaultDocument }
