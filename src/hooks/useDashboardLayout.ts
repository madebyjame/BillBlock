import { useState, useCallback, useEffect } from 'react'
import { type WidgetId, DEFAULT_LAYOUT } from '../types/dashboard'
import { loadDashboardConfig, saveDashboardConfig } from '../lib/dashboardApi'

const LAYOUT_KEY = 'billblock_dashboard_layout'

function isWidgetIdArray(v: unknown): v is WidgetId[] {
  return Array.isArray(v) && v.every(id => typeof id === 'string')
}

function loadLayoutFromStorage(): WidgetId[] {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (!raw) return DEFAULT_LAYOUT
    const parsed = JSON.parse(raw) as unknown
    if (isWidgetIdArray(parsed)) {
      const savedSet = new Set(parsed)
      const missing = DEFAULT_LAYOUT.filter(id => !savedSet.has(id))
      return [...parsed, ...missing]
    }
  } catch { /* ignore */ }
  return DEFAULT_LAYOUT
}

export function useDashboardLayout(userId: string) {
  // Optimistic: start from localStorage cache immediately
  const [layout, setLayout] = useState<WidgetId[]>(loadLayoutFromStorage)

  // On mount, load authoritative config from Supabase and replace
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void loadDashboardConfig(userId).then(remote => {
      if (!cancelled) setLayout(remote)
    })
    return () => { cancelled = true }
  }, [userId])

  const updateLayout = useCallback((newLayout: WidgetId[]) => {
    setLayout(newLayout)
    // Optimistic: persist to localStorage immediately
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(newLayout))
    } catch { /* ignore */ }
    // Async persist to Supabase (fire-and-forget — errors are non-fatal)
    void saveDashboardConfig(userId, newLayout)
  }, [userId])

  return { layout, updateLayout }
}
