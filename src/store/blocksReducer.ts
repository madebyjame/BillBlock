import type { Block, BlockType } from '../types/block'
import { defaultBlockData } from '../types/block'
import { generateId } from '../utils/idGenerator'

export type BlocksAction =
  | { type: 'ADD_BLOCK'; blockType: BlockType }
  | { type: 'REMOVE_BLOCK'; id: string }
  | { type: 'UPDATE_BLOCK'; id: string; data: Partial<Block['data']> }
  | { type: 'REORDER_BLOCKS'; ids: string[] }

export function blocksReducer(state: Block[], action: BlocksAction): Block[] {
  switch (action.type) {
    case 'ADD_BLOCK':
      return [...state, { id: generateId(), type: action.blockType, data: { ...defaultBlockData[action.blockType] } } as Block]
    case 'REMOVE_BLOCK':
      return state.filter(b => b.id !== action.id)
    case 'UPDATE_BLOCK':
      return state.map(b => b.id === action.id ? { ...b, data: { ...b.data, ...action.data } } as Block : b)
    case 'REORDER_BLOCKS': {
      const map = new Map(state.map(b => [b.id, b]))
      return action.ids.map(id => map.get(id)!).filter(Boolean)
    }
    default:
      return state
  }
}

export const initialBlocks: Block[] = [
  { id: generateId(), type: 'header',   data: { ...defaultBlockData.header }   as import('../types/block').HeaderBlockData },
  { id: generateId(), type: 'docInfo',  data: { ...defaultBlockData.docInfo }  as import('../types/block').DocInfoBlockData },
  { id: generateId(), type: 'customer', data: { ...defaultBlockData.customer } as import('../types/block').CustomerBlockData },
  { id: generateId(), type: 'table',    data: { ...defaultBlockData.table }    as import('../types/block').TableBlockData },
  { id: generateId(), type: 'summary',  data: { ...defaultBlockData.summary }  as import('../types/block').SummaryBlockData },
  { id: generateId(), type: 'footer',   data: { ...defaultBlockData.footer }   as import('../types/block').FooterBlockData },
]
