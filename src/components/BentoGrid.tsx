import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion } from 'framer-motion'
import { GripVertical, LayoutDashboard, Check, Layers } from 'lucide-react'
import { type WidgetId, WIDGET_META, PRESET_TEMPLATES } from '../types/dashboard'
import type { DashboardData } from '../types/dashboard'
import QuickActionsWidget from './widgets/QuickActionsWidget'
import RevenueGoalWidget from './widgets/RevenueGoalWidget'
import OverdueInvoicesWidget from './widgets/OverdueInvoicesWidget'
import StockAlertsWidget from './widgets/StockAlertsWidget'
import RecentActivitiesWidget from './widgets/RecentActivitiesWidget'
import QuickNoteWidget from './widgets/QuickNoteWidget'
import TopSpendersWidget from './widgets/TopSpendersWidget'
import CustomerGradesWidget from './widgets/CustomerGradesWidget'

// ─── Widget content renderer ──────────────────────────────────────────────────

function renderWidgetContent(id: WidgetId, data: DashboardData) {
  switch (id) {
    case 'quick-actions':     return <QuickActionsWidget />
    case 'revenue-goal':      return <RevenueGoalWidget data={data} />
    case 'overdue-invoices':  return <OverdueInvoicesWidget data={data} />
    case 'stock-alerts':      return <StockAlertsWidget data={data} />
    case 'recent-activities': return <RecentActivitiesWidget data={data} />
    case 'quick-note':        return <QuickNoteWidget />
    case 'top-spenders':      return <TopSpendersWidget data={data} />
    case 'customer-grades':   return <CustomerGradesWidget data={data} />
  }
}

// Full-bleed widgets control their own background and padding — the card
// wrapper provides only rounded corners + overflow clip (no padding/bg).
const FULL_BLEED = new Set<WidgetId>(['revenue-goal', 'quick-note'])

function cardClass(id: WidgetId) {
  return FULL_BLEED.has(id)
    ? 'h-full overflow-hidden rounded-2xl shadow-sm'
    : 'h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'
}

// ─── Sortable widget wrapper ──────────────────────────────────────────────────

interface SortableWidgetProps {
  id: WidgetId
  editMode: boolean
  data: DashboardData
}

function SortableWidget({ id, editMode, data }: SortableWidgetProps) {
  const meta = WIDGET_META[id]
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  // col-span only — row spans are removed. Rows size to their tallest cell,
  // which naturally creates Bento visual hierarchy without CSS grid gaps.
  const colClass = meta.colSpan === 2 ? 'col-span-1 md:col-span-2' : 'col-span-1'

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      // min-h ensures every row is at least 240 px tall even with sparse content.
      className={`${colClass} min-h-[240px] ${isDragging ? 'opacity-0' : ''}`}
    >
      {/* Lift + glow animation in edit mode (no jiggle) */}
      <motion.div
        className="relative h-full"
        animate={editMode ? { scale: 1.015, y: -3 } : { scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Glowing border overlay — only visible in edit mode */}
        {editMode && (
          <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-2 ring-blue-400/70 shadow-lg shadow-blue-500/20" />
        )}

        {/* Drag handle — top-left, only in edit mode */}
        {editMode && (
          <button
            {...attributes}
            {...listeners}
            className="absolute left-2 top-2 z-20 flex cursor-grab items-center justify-center rounded-lg bg-blue-500 p-1.5 shadow-md active:cursor-grabbing"
            title="ลากเพื่อย้าย"
          >
            <GripVertical size={14} className="text-white" />
          </button>
        )}

        {/* Widget card — h-full fills the lifted motion.div */}
        <div className={cardClass(id)}>
          {/* h-full always present so the widget fills the card */}
          <div className={`h-full${editMode ? ' pointer-events-none select-none' : ''}`}>
            {renderWidgetContent(id, data)}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Drag overlay ghost ───────────────────────────────────────────────────────

function DragGhost({ id }: { id: WidgetId }) {
  const meta = WIDGET_META[id]
  return (
    <motion.div
      initial={{ scale: 1, y: 0 }}
      animate={{ scale: 1.05, y: -8 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl shadow-slate-900/20"
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500">
          <GripVertical size={14} className="text-white" />
        </span>
        <p className="text-sm font-semibold text-slate-700">{meta.titleTh}</p>
      </div>
    </motion.div>
  )
}

// ─── Bento Grid ───────────────────────────────────────────────────────────────

interface BentoGridProps {
  layout: WidgetId[]
  onLayoutChange: (newLayout: WidgetId[]) => void
  data: DashboardData
}

export default function BentoGrid({ layout, onLayoutChange, data }: BentoGridProps) {
  const [editMode, setEditMode] = useState(false)
  const [activeId, setActiveId] = useState<WidgetId | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as WidgetId)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (over && active.id !== over.id) {
      const oldIndex = layout.indexOf(active.id as WidgetId)
      const newIndex = layout.indexOf(over.id as WidgetId)
      onLayoutChange(arrayMove(layout, oldIndex, newIndex))
    }
  }

  function applyTemplate(key: string) {
    const tpl = PRESET_TEMPLATES[key]
    if (tpl) { onLayoutChange(tpl.layout); setShowTemplates(false) }
  }

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="mb-4 flex items-center justify-end gap-2">
        {editMode ? (
          <>
            {/* Template picker */}
            <div className="relative">
              <button
                onClick={() => setShowTemplates(v => !v)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow"
              >
                <Layers size={13} />
                เทมเพลต
              </button>
              {showTemplates && (
                <div className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  {Object.entries(PRESET_TEMPLATES).map(([key, tpl]) => (
                    <button
                      key={key}
                      onClick={() => applyTemplate(key)}
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Done */}
            <button
              onClick={() => { setEditMode(false); setShowTemplates(false) }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
            >
              <Check size={13} />
              เสร็จแล้ว
            </button>
          </>
        ) : (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 hover:shadow"
          >
            <LayoutDashboard size={13} />
            แก้ไข Dashboard
          </button>
        )}
      </div>

      {/* ── Grid area ──
          In edit mode: subtle dot-grid background gives spatial guidance.
          Negative margin + matching padding keeps widgets pixel-aligned. */}
      <div
        className="transition-[background] duration-300"
        style={
          editMode
            ? {
                backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.45) 1.5px, transparent 1.5px)',
                backgroundSize: '28px 28px',
                margin: '-12px',
                padding: '12px',
                borderRadius: '20px',
              }
            : undefined
        }
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={layout} strategy={rectSortingStrategy}>
            {/* No explicit grid-auto-rows — rows size naturally to tallest cell.
                min-h-[240px] on each cell guarantees a readable minimum height. */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {layout.map(id => (
                <SortableWidget key={id} id={id} editMode={editMode} data={data} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId ? <DragGhost id={activeId} /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  )
}
