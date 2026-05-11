import { useState, useCallback, useEffect } from 'react'
import { type WidgetId, DEFAULT_LAYOUT } from '../types/dashboard'
import { loadDashboardConfig, saveDashboardConfig, isKnownWidgetId } from '../lib/dashboardApi'

const LAYOUT_KEY = 'billblock_dashboard_layout'

function isWidgetIdArray(v: unknown): v is WidgetId[] {
  return Array.isArray(v) && v.every(id => typeof id === 'string')
}

// Strips unknown/removed widget IDs — safe migration when registry shrinks
function sanitizeLayout(ids: WidgetId[]): WidgetId[] {
  return ids.filter(id => isKnownWidgetId(id))
}

function loadLayoutFromStorage(): WidgetId[] {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (raw === null) return DEFAULT_LAYOUT  // first ever visit → empty
    const parsed = JSON.parse(raw) as unknown
    if (isWidgetIdArray(parsed)) return sanitizeLayout(parsed)  // may be []
  } catch { /* ignore */ }
  return DEFAULT_LAYOUT
}

export function useDashboardLayout(userId: string) {
  const [layout, setLayout] = useState<WidgetId[]>(loadLayoutFromStorage)

  // Authoritative config from Supabase on mount
  // Only overrides local state if Supabase actually has a saved config (non-null)
  // null = no config stored → keep localStorage (prevents wipe when migration not applied)
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void loadDashboardConfig(userId).then(remote => {
      if (!cancelled && remote !== null) setLayout(sanitizeLayout(remote))
    })
    return () => { cancelled = true }
  }, [userId])

  const updateLayout = useCallback((newLayout: WidgetId[]) => {
    const sanitized = sanitizeLayout(newLayout)
    setLayout(sanitized)
    try {
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(sanitized))
    } catch { /* ignore */ }
    void saveDashboardConfig(userId, sanitized)
  }, [userId])

  return { layout, updateLayout }
}
