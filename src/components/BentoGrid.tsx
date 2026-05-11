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
import { GripVertical, LayoutDashboard, Check, Layers, Plus, X } from 'lucide-react'
import { type WidgetId, WIDGET_META, PRESET_TEMPLATES } from '../types/dashboard'
import type { DashboardData, Plan } from '../types/dashboard'

// ── Existing widgets ──
import QuickActionsWidget from './widgets/QuickActionsWidget'
import RevenueGoalWidget from './widgets/RevenueGoalWidget'
import OverdueInvoicesWidget from './widgets/OverdueInvoicesWidget'
import StockAlertsWidget from './widgets/StockAlertsWidget'
import RecentActivitiesWidget from './widgets/RecentActivitiesWidget'
import QuickNoteWidget from './widgets/QuickNoteWidget'
import TopSpendersWidget from './widgets/TopSpendersWidget'
import CustomerGradesWidget from './widgets/CustomerGradesWidget'
import OnboardingWidget from './widgets/OnboardingWidget'
import GrossProfitWidget from './widgets/GrossProfitWidget'
import LowStockDetailWidget from './widgets/LowStockDetailWidget'
import SalesForecastWidget from './widgets/SalesForecastWidget'

// ── New free widgets ──
import PlanUsageWidget from './widgets/PlanUsageWidget'
import AnnouncementsWidget from './widgets/AnnouncementsWidget'
import Revenue30dWidget from './widgets/Revenue30dWidget'
import TotalOutstandingWidget from './widgets/TotalOutstandingWidget'
import PendingPaymentsWidget from './widgets/PendingPaymentsWidget'
import TopSellersQtyWidget from './widgets/TopSellersQtyWidget'
import NewCustomersWidget from './widgets/NewCustomersWidget'
import OutOfStockWidget from './widgets/OutOfStockWidget'
import DraftDocumentsWidget from './widgets/DraftDocumentsWidget'
import GoalTrackerWidget from './widgets/GoalTrackerWidget'

// ── Coming soon stub ──
import ComingSoonWidget from './widgets/ComingSoonWidget'

import WidgetDrawer from './WidgetDrawer'

// ─── Widget content renderer ──────────────────────────────────────────────────

function renderWidgetContent(id: WidgetId, data: DashboardData) {
  switch (id) {
    // FREE — existing
    case 'quick-actions':     return <QuickActionsWidget />
    case 'onboarding':        return <OnboardingWidget data={data} />
    case 'recent-activities': return <RecentActivitiesWidget data={data} />
    case 'overdue-invoices':  return <OverdueInvoicesWidget data={data} />
    case 'stock-alerts':      return <StockAlertsWidget data={data} />
    // FREE — new
    case 'plan-usage':        return <PlanUsageWidget />
    case 'announcements':     return <AnnouncementsWidget />
    case 'revenue-30d':       return <Revenue30dWidget data={data} />
    case 'total-outstanding': return <TotalOutstandingWidget data={data} />
    case 'pending-payments':  return <PendingPaymentsWidget data={data} />
    case 'top-sellers-qty':   return <TopSellersQtyWidget data={data} />
    case 'new-customers':     return <NewCustomersWidget />
    case 'out-of-stock':      return <OutOfStockWidget />
    case 'draft-documents':   return <DraftDocumentsWidget data={data} />
    case 'goal-tracker':      return <GoalTrackerWidget data={data} />
    // PRO — existing
    case 'gross-profit':      return <GrossProfitWidget data={data} />
    case 'revenue-goal':      return <RevenueGoalWidget data={data} />
    case 'top-spenders':      return <TopSpendersWidget data={data} />
    case 'customer-grades':   return <CustomerGradesWidget data={data} />
    case 'low-stock-detail':  return <LowStockDetailWidget data={data} />
    case 'quick-note':        return <QuickNoteWidget />
    // PRO — stubs
    case 'cashflow-chart':    return <ComingSoonWidget titleTh="กระแสเงินสด 6 เดือน" requiredPlan="pro" descriptionTh="เงินเข้า-ออกรายเดือน" />
    case 'mom-revenue':       return <ComingSoonWidget titleTh="เทียบยอดเดือนที่แล้ว" requiredPlan="pro" descriptionTh="เปรียบเทียบรายได้เดือนนี้กับเดือนก่อน" />
    case 'wht-summary':       return <ComingSoonWidget titleTh="WHT สะสม" requiredPlan="pro" descriptionTh="ภาษีหัก ณ ที่จ่ายสะสม" />
    case 'top-invoice':       return <ComingSoonWidget titleTh="ใบแจ้งหนี้สูงสุด" requiredPlan="pro" descriptionTh="ใบแจ้งหนี้มูลค่าสูงสุดเดือนนี้" />
    case 'pipeline-value':    return <ComingSoonWidget titleTh="มูลค่า Pipeline" requiredPlan="pro" descriptionTh="ใบเสนอราคาที่รอปิดการขาย" />
    case 'high-risk-customers': return <ComingSoonWidget titleTh="ลูกค้าหนี้เสีย" requiredPlan="pro" descriptionTh="ลูกค้าค้างชำระเกิน 90 วัน" />
    case 'inactive-customers':  return <ComingSoonWidget titleTh="ลูกค้าที่หายไป" requiredPlan="pro" descriptionTh="ไม่มีธุรกรรมนาน 3 เดือน" />
    case 'portal-views':        return <ComingSoonWidget titleTh="สถิติดูเอกสาร" requiredPlan="pro" descriptionTh="จำนวนครั้งที่ลูกค้าเปิดเอกสาร" />
    case 'top-profitable-products': return <ComingSoonWidget titleTh="สินค้ากำไรสูงสุด" requiredPlan="pro" descriptionTh="สินค้าที่ทำกำไรสูงสุด" />
    case 'recent-stock-adjustments': return <ComingSoonWidget titleTh="ประวัติปรับสต็อก" requiredPlan="pro" descriptionTh="การปรับสต็อกล่าสุด" />
    case 'total-stock-value':   return <ComingSoonWidget titleTh="มูลค่าสต็อกรวม" requiredPlan="pro" descriptionTh="มูลค่าสินค้าคงเหลือทั้งหมด" />
    case 'quote-conversion-rate': return <ComingSoonWidget titleTh="อัตราปิดการขาย" requiredPlan="pro" descriptionTh="ใบเสนอราคาที่ปิดเป็นออเดอร์ (%)" />
    case 'expiring-quotes':     return <ComingSoonWidget titleTh="ใบเสนอราคาใกล้หมดอายุ" requiredPlan="pro" descriptionTh="หมดอายุใน 7 วัน" />
    case 'payment-method-stats': return <ComingSoonWidget titleTh="ช่องทางชำระเงิน" requiredPlan="pro" descriptionTh="สถิติการชำระเงินแต่ละช่องทาง" />
    // BUSINESS — existing
    case 'sales-forecast':    return <SalesForecastWidget data={data} />
    // BUSINESS — stubs
    case 'expected-cash-inflow': return <ComingSoonWidget titleTh="คาดการณ์เงินเข้า" requiredPlan="business" descriptionTh="เงินที่คาดว่าจะได้รับจากลูกหนี้" />
    case 'vat-payable':       return <ComingSoonWidget titleTh="VAT รอยื่น" requiredPlan="business" descriptionTh="ภาษีมูลค่าเพิ่มที่ต้องยื่น" />
    case 'avg-payment-time':  return <ComingSoonWidget titleTh="เวลาเก็บเงินเฉลี่ย" requiredPlan="business" descriptionTh="DSO — จำนวนวันเฉลี่ย" />
    case 'revenue-concentration': return <ComingSoonWidget titleTh="ความเสี่ยงลูกค้าเดียว" requiredPlan="business" descriptionTh="% รายได้จากลูกค้าอันดับ 1" />
    case 'sales-by-salesperson': return <ComingSoonWidget titleTh="ยอดขายรายพนักงาน" requiredPlan="business" descriptionTh="ยอดขายแยกตามเซลส์" />
    case 'top-converter-sales': return <ComingSoonWidget titleTh="พนักงานปิดยอดเก่ง" requiredPlan="business" descriptionTh="เซลส์ที่มีอัตราปิดสูงสุด" />
    case 'overdue-by-salesperson': return <ComingSoonWidget titleTh="หนี้ค้างรายเซลส์" requiredPlan="business" descriptionTh="ยอดค้างชำระแยกตามเซลส์" />
    case 'dead-stock':        return <ComingSoonWidget titleTh="สินค้าค้างสต็อก" requiredPlan="business" descriptionTh="ไม่ขายมานานกว่า 90 วัน" />
    case 'inventory-turnover': return <ComingSoonWidget titleTh="อัตราหมุนเวียนสินค้า" requiredPlan="business" descriptionTh="ความถี่ที่สต็อกหมุนเวียนต่อปี" />
    case 'sales-by-category': return <ComingSoonWidget titleTh="ยอดขายตามหมวด" requiredPlan="business" descriptionTh="ยอดขายแยกตามหมวดหมู่สินค้า" />
    case 'export-shortcuts':  return <ComingSoonWidget titleTh="Export ข้อมูล" requiredPlan="business" descriptionTh="ส่งออกรายงานด้วยคลิกเดียว" />
    case 'cancellation-ratio': return <ComingSoonWidget titleTh="อัตรายกเลิกเอกสาร" requiredPlan="business" descriptionTh="% เอกสารที่ถูกยกเลิก" />
    case 'audit-log':         return <ComingSoonWidget titleTh="ประวัติการใช้งาน" requiredPlan="business" descriptionTh="ติดตามการเปลี่ยนแปลงในระบบ" />
    case 'ytd-summary':       return <ComingSoonWidget titleTh="ภาพรวมปีปัจจุบัน" requiredPlan="business" descriptionTh="สรุปผลประกอบการตั้งแต่ต้นปี" />
  }
}

// Full-bleed widgets control their own background and padding
const FULL_BLEED = new Set<WidgetId>(['revenue-goal', 'quick-note'])

function cardClass(id: WidgetId) {
  return FULL_BLEED.has(id)
    ? 'h-full overflow-hidden rounded-2xl shadow-sm'
    : 'h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'
}

// ─── Empty dashboard state ────────────────────────────────────────────────────

function EmptyDashboard({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <LayoutDashboard size={28} className="text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-700">Dashboard ว่างเปล่า</h3>
      <p className="mt-1 max-w-xs text-sm text-slate-400">
        คลิก "แก้ไข Dashboard" แล้วเลือก Widget ที่ต้องการแสดง
      </p>
      <button
        onClick={onOpenDrawer}
        className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        <Plus size={15} />
        เพิ่ม Widget แรก
      </button>
    </div>
  )
}

// ─── Sortable widget wrapper ──────────────────────────────────────────────────

interface SortableWidgetProps {
  id: WidgetId
  editMode: boolean
  data: DashboardData
  onRemove: (id: WidgetId) => void
}

function SortableWidget({ id, editMode, data, onRemove }: SortableWidgetProps) {
  const meta = WIDGET_META[id]
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const colClass = meta.colSpan === 2 ? 'col-span-1 md:col-span-2' : 'col-span-1'
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${colClass} min-h-[260px] ${isDragging ? 'opacity-0' : ''}`}
    >
      <motion.div
        className="relative h-full"
        animate={editMode ? { scale: 1.015, y: -3 } : { scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Glowing border overlay */}
        {editMode && (
          <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-2 ring-blue-400/70 shadow-lg shadow-blue-500/20" />
        )}

        {/* Drag handle — top-left */}
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

        {/* Remove button — top-right */}
        {editMode && (
          <button
            onClick={() => onRemove(id)}
            className="absolute right-2 top-2 z-20 flex items-center justify-center rounded-lg bg-red-500 p-1.5 shadow-md transition-colors hover:bg-red-600"
            title="นำออก"
          >
            <X size={14} className="text-white" />
          </button>
        )}

        {/* Widget card */}
        <div className={cardClass(id)}>
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
  plan: Plan
}

export default function BentoGrid({ layout, onLayoutChange, data, plan }: BentoGridProps) {
  const [editMode, setEditMode]       = useState(false)
  const [activeId, setActiveId]       = useState<WidgetId | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [drawerOpen, setDrawerOpen]   = useState(false)

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

  function handleRemoveWidget(id: WidgetId) {
    onLayoutChange(layout.filter(wid => wid !== id))
  }

  function handleAddWidget(id: WidgetId) {
    if (!layout.includes(id)) {
      onLayoutChange([...layout, id])
    }
  }

  function handleOpenDrawer() {
    setEditMode(true)
    setDrawerOpen(true)
  }

  return (
    <div>
      {/* ── Toolbar ── */}
      <div className="mb-4 flex items-center justify-end gap-2">
        {editMode ? (
          <>
            {/* Add widget button */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:shadow"
            >
              <Plus size={13} />
              เพิ่ม Widget
            </button>

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

      {/* ── Empty state ── */}
      {layout.length === 0 && (
        <EmptyDashboard onOpenDrawer={handleOpenDrawer} />
      )}

      {/* ── Grid area ── */}
      {layout.length > 0 && (
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
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {layout.map(id => (
                  <SortableWidget
                    key={id}
                    id={id}
                    editMode={editMode}
                    data={data}
                    onRemove={handleRemoveWidget}
                  />
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeId ? <DragGhost id={activeId} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* ── Widget drawer ── */}
      <WidgetDrawer
        open={drawerOpen}
        currentLayout={layout}
        plan={plan}
        onAdd={handleAddWidget}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  )
}
