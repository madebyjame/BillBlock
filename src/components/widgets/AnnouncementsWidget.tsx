import { useState, useEffect } from 'react'

interface Announcement {
  id: string
  title: string
  date: string
}

const ANNOUNCEMENTS: Announcement[] = [
  { id: 'ann-1', title: '✨ ฟีเจอร์ใหม่: รายงาน AR Aging พร้อมแล้ว', date: '2026-05-01' },
  { id: 'ann-2', title: '🚀 Dashboard ปรับแต่งได้แล้ว — เพิ่ม/ลด Widget ตามใจ', date: '2026-04-20' },
  { id: 'ann-3', title: '📊 รายงาน WHT อัปเดตใหม่รองรับ ภ.ง.ด. 3 และ 53', date: '2026-04-10' },
]

const STORAGE_KEY = 'bb_read_announcements'

function getReadSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed) && parsed.every(x => typeof x === 'string')) {
      return new Set(parsed as string[])
    }
  } catch { /* ignore */ }
  return new Set()
}

function saveReadSet(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch { /* ignore */ }
}

export default function AnnouncementsWidget() {
  const [readIds, setReadIds] = useState<Set<string>>(getReadSet)

  // Sync read state to localStorage whenever it changes
  useEffect(() => {
    saveReadSet(readIds)
  }, [readIds])

  function markRead(id: string) {
    setReadIds(prev => new Set([...prev, id]))
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">ข่าวสาร</p>
      <div className="flex flex-col gap-2 flex-1">
        {ANNOUNCEMENTS.map(ann => {
          const isRead = readIds.has(ann.id)
          return (
            <button
              key={ann.id}
              onClick={() => markRead(ann.id)}
              className="flex items-start gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-left transition-colors hover:bg-slate-100"
            >
              {/* Unread dot */}
              <span className="mt-1 flex h-2 w-2 shrink-0">
                {!isRead && (
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-xs leading-snug ${isRead ? 'text-slate-400' : 'font-medium text-slate-700'}`}>
                  {ann.title}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">{formatDate(ann.date)}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
