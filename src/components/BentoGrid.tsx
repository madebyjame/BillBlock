import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
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
import { WidgetId, WIDGET_META, PRESET_TEMPLATES } from '../types/dashboard'
import type { DashboardData } from '../types/dashboard'
import QuickActionsWidget from './widgets/QuickActionsWidget'
import RevenueGoalWidget from './widgets/RevenueGoalWidget'
import OverdueInvoicesWidget from './widgets/OverdueInvoicesWidget'
import StockAlertsWidget from './widgets/StockAlertsWidget'
import RecentActivitiesWidget from './widgets/RecentActivitiesWidget'
import QuickNoteWidget from './widgets/QuickNoteWidget'
import TopSpendersWidget from './widgets/TopSpendersWidget'

// ─── Widget Renderer ──────────────────────────────────────────────────────────

function renderWidgetContent(id: WidgetId, data: DashboardData) {
  switch (id) {
    case 'quick-actions':
      return <QuickActionsWidget />
    case 'revenue-goal':
      return <RevenueGoalWidget data={data} />
    case 'overdue-invoices':
      return <OverdueInvoicesWidget data={data} />
    case 'stock-alerts':
      return <StockAlertsWidget data={data} />
    case 'recent-activities':
      return <RecentActivitiesWidget data={data} />
    case 'quick-note':
      return <QuickNoteWidget />
    case 'top-spenders':
      return <TopSpendersWidget data={data} />
  }
}

// Widgets with special full-bleed card styles (they control their own bg)
const FULL_BLEED_WIDGETS = new Set<WidgetId>(['revenue-goal', 'quick-note'])

function widgetCardClass(id: WidgetId): string {
  if (FULL_BLEED_WIDGETS.has(id)) return 'rounded-2xl overflow-hidden shadow-sm'
  return 'rounded-2xl bg-white border border-slate-200 p-5 shadow-sm'
}

// ─── Sortable Widget ──────────────────────────────────────────────────────────

interface SortableWidgetProps {
  id: WidgetId
  editMode: boolean
  data: DashboardData
}

function SortableWidget({ id, editMode, data }: SortableWidgetProps) {
  const meta = WIDGET_META[id]
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const colClass = meta.colSpan === 2 ? 'col-span-1 md:col-span-2' : 'col-span-1'
  const rowClass = meta.rowSpan === 2 ? 'row-span-1 lg:row-span-2' : 'row-span-1'

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${colClass} ${rowClass} ${isDragging ? 'opacity-0' : ''}`}
    >
      <motion.div
        animate={
          editMode
            ? { rotate: [-1.2, 1.2] }
            : { rotate: 0 }
        }
        transition={
          editMode
            ? { repeat: Infinity, repeatType: 'mirror', duration: 0.35, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
        className="relative h-full"
      >
        {/* Edit mode ring + handle */}
        {editMode && (
          <>
            <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-2 ring-blue-400/60 ring-offset-1" />
            <button
              {...attributes}
              {...listeners}
              className="absolute left-2 top-2 z-20 flex cursor-grab items-center justify-center rounded-lg bg-blue-500 p-1.5 shadow-md active:cursor-grabbing"
              title="ลากเพื่อย้าย"
            >
              <GripVertical size={14} className="text-white" />
            </button>
          </>
        )}

        {/* Widget card */}
        <div className={`h-full ${widgetCardClass(id)}`}>
          <div className={editMode ? 'pointer-events-none select-none' : 'h-full'}>
            {renderWidgetContent(id, data)}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Drag Overlay Ghost ───────────────────────────────────────────────────────

function DragGhost({ id }: { id: WidgetId }) {
  const meta = WIDGET_META[id]
  return (
    <div className="rounded-2xl bg-blue-50 border-2 border-dashed border-blue-300 p-4 shadow-xl opacity-90">
      <p className="text-sm font-semibold text-blue-600">{meta.titleTh}</p>
    </div>
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
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
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
    if (tpl) {
      onLayoutChange(tpl.layout)
      setShowTemplates(false)
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-end gap-2">
        {editMode && (
          <>
            {/* Templates button */}
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
                      className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Done button */}
            <button
              onClick={() => { setEditMode(false); setShowTemplates(false) }}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
            >
              <Check size={13} />
              เสร็จแล้ว
            </button>
          </>
        )}

        {!editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-700 hover:shadow"
          >
            <LayoutDashboard size={13} />
            แก้ไข Dashboard
          </button>
        )}
      </div>

      {/* Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={layout} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:[grid-auto-rows:minmax(260px,auto)]">
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
  )
}
