import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  /** Optional label shown in the error card (e.g. "แดชบอร์ด") */
  label?: string
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console — swap with Sentry/LogRocket if added later
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <div className="max-w-sm">
          <h2 className="text-lg font-semibold text-slate-800">
            {this.props.label ? `${this.props.label}เกิดข้อผิดพลาด` : 'เกิดข้อผิดพลาด'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            ส่วนนี้โหลดไม่สำเร็จ กด &ldquo;โหลดใหม่&rdquo; หรือรีเฟรชหน้า
          </p>
          {import.meta.env.DEV && (
            <pre className="mt-3 overflow-auto rounded-lg bg-slate-100 p-3 text-left text-xs text-slate-600">
              {this.state.error.message}
            </pre>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={this.reset}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <RefreshCw size={15} />
            โหลดใหม่
          </button>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            รีเฟรชหน้า
          </button>
        </div>
      </div>
    )
  }
}
