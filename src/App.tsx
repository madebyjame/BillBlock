import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { useAuth } from './context/AuthContext'
import { PlanProvider } from './context/PlanContext'
import LoginPage from './components/LoginPage'
import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import DocumentListPage from './pages/DocumentListPage'
import EditorPage from './pages/EditorPage'
import SettingsPage from './pages/SettingsPage'
import CustomersPage from './pages/CustomersPage'
import ProductsPage from './pages/ProductsPage'
import LandingPage from './pages/LandingPage'
import StockAdjustmentPage from './pages/StockAdjustmentPage'
import StockMovementPage from './pages/StockMovementPage'
import ProductDetailPage from './pages/ProductDetailPage'
import PortalPage from './pages/PortalPage'
import TermsPage from './pages/TermsPage'
import PrivacyPage from './pages/PrivacyPage'
import RefundPage from './pages/RefundPage'
import VatReportPage from './pages/VatReportPage'
import WhtReportPage from './pages/WhtReportPage'
import PlReportPage from './pages/PlReportPage'

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm">กำลังโหลด...</span>
      </div>
    </div>
  )
}

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  return <PlanProvider><Outlet /></PlanProvider>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function RootRoute() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) return <Navigate to="/dashboard" replace />
  return <LandingPage />
}

export default function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<RootRoute />} />

        <Route path="/login" element={
          <PublicRoute><LoginPage /></PublicRoute>
        } />

        <Route element={<ProtectedRoute />}>

          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* งานขาย */}
            <Route path="/documents/quotations"    element={<DocumentListPage docType="quotation" />} />
            <Route path="/documents/invoices"      element={<DocumentListPage docType="invoice" />} />
            <Route path="/documents/receipts"      element={<DocumentListPage docType="receipt" />} />
            <Route path="/documents/billing-notes" element={<DocumentListPage docType="billing-note" />} />
            <Route path="/documents/tax-invoices"  element={<DocumentListPage docType="tax-invoice" />} />

            {/* คลังสินค้า */}
            <Route path="/inventory/products"     element={<ProductsPage />} />
            <Route path="/inventory/products/:id" element={<ProductDetailPage />} />
            <Route path="/inventory/adjustments"  element={<StockAdjustmentPage />} />
            <Route path="/inventory/movements"    element={<StockMovementPage />} />

            <Route path="/products"   element={<Navigate to="/inventory/products" replace />} />
            <Route path="/customers"  element={<CustomersPage />} />
            <Route path="/settings"   element={<SettingsPage />} />

            {/* รายงาน */}
            <Route path="/reports/vat" element={<VatReportPage />} />
            <Route path="/reports/wht" element={<WhtReportPage />} />
            <Route path="/reports/pl"  element={<PlReportPage />} />
          </Route>

          <Route path="/editor/:id" element={<EditorPage />} />

        </Route>

        {/* Public portal — no auth required */}
        <Route path="/portal/:token" element={<PortalPage />} />

        {/* Legal pages — public */}
        <Route path="/terms"   element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/refund"  element={<RefundPage />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
    <Analytics />
    <SpeedInsights />
    </>
  )
}
