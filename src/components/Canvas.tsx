import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'
import type { Block, TableBlockData } from '../types/block'
import type { BlocksAction } from '../store/blocksReducer'
import HeaderBlock from './blocks/HeaderBlock'
import DocInfoBlock from './blocks/DocInfoBlock'
import CustomerBlock from './blocks/CustomerBlock'
import TableBlock from './blocks/TableBlock'
import SummaryBlock from './blocks/SummaryBlock'
import FooterBlock from './blocks/FooterBlock'

interface CanvasProps {
  blocks: Block[]
  dispatch: React.Dispatch<BlocksAction>
  canvasRef: React.RefObject<HTMLDivElement | null>
}

export default function Canvas({ blocks, dispatch, canvasRef }: CanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const reordered = arrayMove(blocks, blocks.findIndex(b => b.id === active.id), blocks.findIndex(b => b.id === over.id))
    dispatch({ type: 'REORDER_BLOCKS', ids: reordered.map(b => b.id) })
  }

  // หา table data เพื่อส่งให้ SummaryBlock คำนวณ
  const tableBlock = blocks.find(b => b.type === 'table')
  const tableData = tableBlock?.type === 'table' ? tableBlock.data as TableBlockData : undefined

  return (
    <main className="flex-1 overflow-y-auto bg-slate-100 p-6">
      {/* Canvas กว้าง A4 */}
      <div
        ref={canvasRef}
        className="mx-auto w-full max-w-3xl rounded-lg bg-white shadow-md"
        style={{ minHeight: '297mm' }}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter}
          onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}>
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="p-6">
              {blocks.length === 0
                ? <EmptyState />
                : blocks.map(block => (
                    <BlockRenderer key={block.id} block={block} dispatch={dispatch} tableData={tableData} />
                  ))
              }
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </main>
  )
}

function BlockRenderer({
  block,
  dispatch,
  tableData,
}: {
  block: Block
  dispatch: React.Dispatch<BlocksAction>
  tableData?: TableBlockData
}) {
  const common = {
    id: block.id,
    onRemove: () => dispatch({ type: 'REMOVE_BLOCK', id: block.id }),
  }
  const update = (data: Partial<Block['data']>) =>
    dispatch({ type: 'UPDATE_BLOCK', id: block.id, data })

  switch (block.type) {
    case 'header':   return <HeaderBlock   {...common} data={block.data} onChange={update} />
    case 'docInfo':  return <DocInfoBlock  {...common} data={block.data} onChange={update} />
    case 'customer': return <CustomerBlock {...common} data={block.data} onChange={update} />
    case 'table':    return <TableBlock    {...common} data={block.data} onChange={update} />
    case 'summary':  return <SummaryBlock  {...common} data={block.data} onChange={update} tableData={tableData} />
    case 'footer':   return <FooterBlock   {...common} data={block.data} onChange={update} />
  }
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-300">
      <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p className="text-sm">คลิก Block ในแถบซ้ายเพื่อเริ่มสร้างเอกสาร</p>
    </div>
  )
}
