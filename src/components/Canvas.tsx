import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers'
import type { Block } from '../types/block'
import type { BlocksAction } from '../store/blocksReducer'
import HeaderBlock from './blocks/HeaderBlock'
import InfoBlock from './blocks/InfoBlock'
import TableBlock from './blocks/TableBlock'
import TextBlock from './blocks/TextBlock'
import FooterBlock from './blocks/FooterBlock'

interface CanvasProps {
  blocks: Block[]
  dispatch: React.Dispatch<BlocksAction>
  canvasRef: React.RefObject<HTMLDivElement | null>
}

export default function Canvas({ blocks, dispatch, canvasRef }: CanvasProps) {
  // Sensor: PointerSensor สำหรับ mouse/touch, KeyboardSensor สำหรับ accessibility
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // ต้อง drag อย่างน้อย 8px ก่อน activate — ป้องกันการ drag โดยไม่ตั้งใจ
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // เมื่อ drag จบ — คำนวณ index ใหม่แล้ว dispatch REORDER_BLOCKS
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = blocks.findIndex(b => b.id === active.id)
    const newIndex = blocks.findIndex(b => b.id === over.id)
    const reordered = arrayMove(blocks, oldIndex, newIndex)
    dispatch({ type: 'REORDER_BLOCKS', ids: reordered.map(b => b.id) })
  }

  return (
    <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
      {/* พื้นที่ Canvas ขนาด A4 กว้าง */}
      <div
        ref={canvasRef}
        className="mx-auto w-full max-w-3xl rounded-xl bg-white p-8 shadow-lg"
        style={{ minHeight: '297mm' }}  // ความสูง A4
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
        >
          <SortableContext
            items={blocks.map(b => b.id)}
            strategy={verticalListSortingStrategy}
          >
            {blocks.length === 0 ? (
              <EmptyState />
            ) : (
              blocks.map(block => (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  dispatch={dispatch}
                />
              ))
            )}
          </SortableContext>
        </DndContext>
      </div>
    </main>
  )
}

// ─────────────────────────────────────────
// Render Block ถูกประเภทตาม type
// ─────────────────────────────────────────
function BlockRenderer({ block, dispatch }: { block: Block; dispatch: React.Dispatch<BlocksAction> }) {
  const commonProps = {
    id: block.id,
    onRemove: () => dispatch({ type: 'REMOVE_BLOCK', id: block.id }),
  }

  switch (block.type) {
    case 'header':
      return (
        <HeaderBlock
          {...commonProps}
          data={block.data}
          onChange={data => dispatch({ type: 'UPDATE_BLOCK', id: block.id, data })}
        />
      )
    case 'info':
      return (
        <InfoBlock
          {...commonProps}
          data={block.data}
          onChange={data => dispatch({ type: 'UPDATE_BLOCK', id: block.id, data })}
        />
      )
    case 'table':
      return (
        <TableBlock
          {...commonProps}
          data={block.data}
          onChange={data => dispatch({ type: 'UPDATE_BLOCK', id: block.id, data })}
        />
      )
    case 'text':
      return (
        <TextBlock
          {...commonProps}
          data={block.data}
          onChange={data => dispatch({ type: 'UPDATE_BLOCK', id: block.id, data })}
        />
      )
    case 'footer':
      return (
        <FooterBlock
          {...commonProps}
          data={block.data}
          onChange={data => dispatch({ type: 'UPDATE_BLOCK', id: block.id, data })}
        />
      )
  }
}

// แสดงเมื่อยังไม่มี Block เลย
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
      <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p className="text-sm">ยังไม่มี Block — คลิก "เพิ่ม Block" ในแถบซ้าย</p>
    </div>
  )
}
