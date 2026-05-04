import type { Block, BlockType } from '../types/block'
import { defaultBlockData } from '../types/block'
import { generateId } from '../utils/idGenerator'

// ─────────────────────────────────────────
// Action Types
// ─────────────────────────────────────────
export type BlocksAction =
  | { type: 'ADD_BLOCK'; blockType: BlockType }
  | { type: 'REMOVE_BLOCK'; id: string }
  | { type: 'UPDATE_BLOCK'; id: string; data: Partial<Block['data']> }
  | { type: 'REORDER_BLOCKS'; ids: string[] }  // dnd-kit ส่ง array ของ id ที่เรียงใหม่

// ─────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────
export function blocksReducer(state: Block[], action: BlocksAction): Block[] {
  switch (action.type) {
    case 'ADD_BLOCK': {
      const newBlock = {
        id: generateId(),
        type: action.blockType,
        data: { ...defaultBlockData[action.blockType] },
      } as Block
      return [...state, newBlock]
    }

    case 'REMOVE_BLOCK':
      return state.filter(b => b.id !== action.id)

    case 'UPDATE_BLOCK':
      return state.map(b =>
        b.id === action.id
          ? { ...b, data: { ...b.data, ...action.data } } as Block
          : b
      )

    case 'REORDER_BLOCKS': {
      // เรียง block ตาม array ของ id ที่ส่งมา
      const blockMap = new Map(state.map(b => [b.id, b]))
      return action.ids.map(id => blockMap.get(id)!).filter(Boolean)
    }

    default:
      return state
  }
}

// ─────────────────────────────────────────
// Initial State — เริ่มต้นด้วย Header + Info + Table + Footer
// ─────────────────────────────────────────
export const initialBlocks: Block[] = [
  { id: generateId(), type: 'header', data: { ...defaultBlockData.header } as import('../types/block').HeaderBlockData },
  { id: generateId(), type: 'info',   data: { ...defaultBlockData.info }   as import('../types/block').InfoBlockData },
  { id: generateId(), type: 'table',  data: { ...defaultBlockData.table }  as import('../types/block').TableBlockData },
  { id: generateId(), type: 'footer', data: { ...defaultBlockData.footer } as import('../types/block').FooterBlockData },
]
