import { useState, useCallback } from 'react'
import { WidgetId, DEFAULT_LAYOUT } from '../types/dashboard'

const LAYOUT_KEY = 'billblock_dashboard_layout'

function loadLayout(): WidgetId[] {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return DEFAULT_LAYOUT
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed) && parsed.every(id => typeof id === 'string')) {
      const saved = parsed as WidgetId[]
      const savedSet = new Set(saved)
      const missing = DEFAULT_LAYOUT.filter(id => !savedSet.has(id))
      return [...saved, ...missing]
    }
  } catch { /* ignore */ }
  return DEFAULT_LAYOUT
}

export function useDashboardLayout() {
  const [layout, setLayout] = useState<WidgetId[]>(loadLayout)

  const updateLayout = useCallback((newLayout: WidgetId[]) => {
    setLayout(newLayout)
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(newLayout))
    } catch { /* ignore */ }
  }, [])

  return { layout, updateLayout }
}
