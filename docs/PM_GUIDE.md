# BillBlock — PM Guide (สำหรับ Product Manager)

> อัปเดตล่าสุด: 2026-05  
> เอกสารนี้อธิบายว่า BillBlock คืออะไร ทำงานอย่างไร และ PM ควรรู้อะไรก่อนเขียน spec

---

## 1. BillBlock คืออะไร

BillBlock คือ **Thai SME ERP Platform** — ระบบจัดการธุรกิจครบวงจรสำหรับผู้ประกอบการไทย ที่เน้นความง่าย ราคาถูก และครอบคลุมกว่าแค่ออกเอกสาร

### เป้าหมาย Positioning

```
Zort (inventory-first)  ←  BillBlock  →  Peak Account (accounting-first)
```

BillBlock อยู่ตรงกลาง: เอกสาร + การเงินเบื้องต้น + สต็อก โดยไม่ต้องเรียนบัญชี

---

## 2. Platform — สิ่งที่ PM ต้องเข้าใจก่อนเขียน Spec

### ⚠️ BillBlock เป็น Web App เท่านั้น

| สิ่งที่ไม่ใช่ | สิ่งที่เป็น |
|--------------|------------|
| ❌ React Native / Expo | ✅ React 19 (browser) |
| ❌ Mobile App (iOS/Android) | ✅ Progressive Web App (PWA-ready) |
| ❌ Local / Offline database | ✅ Cloud database (Supabase) |
| ❌ Native hardware access | ✅ Web API (camera, share, file) |

### สิ่ง PM มักเขียน Spec ผิด

| Spec ที่เขียนมา | ความจริง | Web Alternative |
|----------------|----------|-----------------|
| expo-print | Expo only | `window.print()` / jsPDF ✅ มีอยู่แล้ว |
| expo-camera | Expo only | `getUserMedia()` + ZXing (browser) ✅ |
| Native Share Sheet | iOS/Android only | Web Share API ✅ (mobile browser) |
| Local SQLite | React Native only | Supabase PostgreSQL (cloud) |
| Push Notification (background) | Native only | Web Push API ⚠️ (limited) |
| Barcode via ML Kit | Native only | `@zxing/browser` ✅ (browser camera) |

---

## 3. Tech Stack ทั้งหมด

| Layer | Technology | หมายเหตุ |
|-------|-----------|---------|
| Frontend | React 19 + TypeScript strict | ห้าม `any` ใช้ `unknown` + type guard |
| Build | Vite | dev server + production build |
| Styling | Tailwind CSS | utility-first, ไม่มี CSS module |
| Routing | React Router v7 | SPA, ไม่มี SSR |
| Animation | Framer Motion | สำหรับ widget/drag |
| Drag & Drop | @dnd-kit | Dashboard widget reorder |
| Database | Supabase (PostgreSQL) | cloud, RLS enabled ทุก table |
| Auth | Supabase Auth | email/password + magic link |
| Storage | Supabase Storage | logo, signatures |
| PDF | jsPDF + html2canvas-pro | generate PDF ใน browser |
| Excel | xlsx (SheetJS) | export .xlsx ไฟล์ |
| Barcode | @zxing/browser | scan via camera in browser |
| Hosting | Vercel | auto-deploy จาก GitHub main |
| Analytics | Vercel Analytics + Speed Insights | |
| Toast | Sonner | notification |

---

## 4. Features ที่ทำแล้ว (Done)

### เอกสาร (Documents)
- ✅ ใบเสนอราคา, ใบแจ้งหนี้, ใบเสร็จรับเงิน, ใบวางบิล, ใบกำกับภาษี
- ✅ Editor แบบ drag-and-drop (line items)
- ✅ Convert: Quote → Invoice อัตโนมัติ
- ✅ Document number atomic (ไม่มี race condition)
- ✅ PDF preview + print
- ✅ Client Portal (ลูกค้าดูเอกสารผ่าน link)
- ✅ Watermark free plan ("สร้างเอกสารโดย BillBlock")

### ลูกค้า (Customers)
- ✅ CRUD + tags, credit term, salesperson
- ✅ Customer grade (A/B/F ตามประวัติชำระ)
- ✅ ประวัติเอกสารต่อลูกค้า
- ✅ Export CSV

### สินค้า / สต็อก
- ✅ CRUD + SKU, cost price, min stock
- ✅ Stock adjustment (รับเข้า / ปรับ)
- ✅ Stock movement history
- ✅ Low stock alerts บน Dashboard

### Dashboard
- ✅ Bento grid widget (drag to reorder, preset templates)
- ✅ Revenue 30d, pending, overdue KPIs
- ✅ Sparkline chart
- ✅ Onboarding checklist สำหรับ user ใหม่

### ระบบ Plan
- ✅ Free / Pro plan
- ✅ Limit: เอกสาร/เดือน, ลูกค้า, สินค้า
- ✅ Usage bar บน sidebar

### UI/UX
- ✅ Confirm dialog (ไม่ใช้ browser native `confirm()`)
- ✅ Responsive (desktop + mobile browser)
- ✅ Theme color ตามบริษัท
- ✅ Full-screen layout (ไม่มี max-width จำกัด)

---

## 5. Features ที่กำลังทำ (In Progress)

| Feature | Priority | Status |
|---------|----------|--------|
| Partial Payment (บันทึกชำระบางส่วน) | 🔴 สูง | 🚧 กำลังทำ |
| WHT (ภาษีหัก ณ ที่จ่าย) | 🔴 สูง | 🚧 กำลังทำ |
| Excel Export (.xlsx) | 🟡 กลาง | 🚧 กำลังทำ |
| Barcode Scanner (ผ่าน browser camera) | 🟡 กลาง | 🚧 กำลังทำ |

---

## 6. Database Schema (ภาพรวม)

```
auth.users (Supabase Auth)
    │
    ├── profiles          — ข้อมูลบริษัท, plan, theme color
    ├── documents         — เอกสารทุกประเภท (content = JSON)
    │       └── doc_number_sequences  — atomic counter ป้องกัน race condition
    ├── customers         — ข้อมูลลูกค้า
    ├── products          — สินค้า + สต็อก
    │       └── stock_movements  — ประวัติสต็อกทุก transaction
    ├── subscriptions     — plan + billing
    ├── signatures        — ลายเซ็น (base64 image)
    └── portal_tokens     — link สำหรับลูกค้าดูเอกสาร
```

### Security Model

- ทุก table มี **Row Level Security (RLS)** — user เห็นแค่ข้อมูลตัวเอง
- Sensitive function ใช้ `SECURITY DEFINER` + `auth.uid()` check
- API ทุกตัวส่ง Supabase JWT ใน header อัตโนมัติ

### Document Content Structure (JSON)

เอกสารแต่ละใบเก็บ content เป็น JSON ใน `documents.content`:

```typescript
{
  docMeta: { number, date, dueDate, currency, note, whtRate? },
  company: { name, address, taxId, logo, phone, email },
  customer: { name, address, taxId, phone, email },
  items: [{ id, name, qty, unit, price, discount, vatType }],
  summary: { subtotal, vatAmount, total, whtAmount? },
  signature: { url, name },
}
```

---

## 7. Architecture Rules (สิ่งที่ Developer ต้องทำตาม)

1. **Controller → Service → DB** — ห้าม page เรียก Supabase โดยตรง ต้องผ่าน `src/lib/*Api.ts`
2. **ห้ามใช้ `any`** — ต้องใช้ `unknown` + type guard
3. **File naming**: kebab-case files, PascalCase classes, `use*` prefix สำหรับ hooks
4. **Migration naming**: `NNN_description.sql` เรียงตามเลข (ปัจจุบัน: 011)
5. **No worktrees/branches** — commit ตรง `main` branch

---

## 8. สิ่งที่ทำได้ vs ทำไม่ได้ (Reference Card สำหรับ PM)

### ✅ ทำได้บน Web

- PDF generation (jsPDF + html2canvas)
- Camera access → barcode scan (`@zxing/browser`)
- File download (CSV, Excel, PDF)
- Web Share API → แชร์ไฟล์บนมือถือ (iOS Safari, Chrome Android)
- Real-time updates (Supabase Realtime)
- Email sending (ผ่าน Supabase Edge Function)
- OAuth / SSO (Supabase Auth)
- Image upload (Supabase Storage)
- Complex SQL logic (PostgreSQL functions)
- Offline read (Service Worker cache) — ต้อง implement เพิ่ม

### ❌ ทำไม่ได้บน Web (ต้องเป็น Native App)

- Background sync ที่ทำงานเมื่อ app ปิด
- Push notification แบบ native (iOS)
- NFC reading
- Bluetooth / printer hardware
- Face ID / Touch ID (WebAuthn ทำได้บางส่วน)
- ML Kit barcode (แต่ ZXing แทนได้)
- Local SQLite offline database (IndexedDB แทนได้แต่ complex)

---

## 9. Flow การทำงานปัจจุบัน

```
User Login (Supabase Auth)
    ↓
Dashboard (KPI widgets + bento grid)
    ↓
เลือก doc type → DocumentListPage
    ↓
กด "สร้าง" → documentApi.createDocument() → redirect to EditorPage
    ↓
Editor: กรอกข้อมูล → บันทึก → preview PDF
    ↓
ส่งลูกค้า: สร้าง portal token → share link → PortalPage (no auth)
    ↓
เปลี่ยนสถานะ: draft → sent → paid (หรือ cancelled)
    ↓
Convert: quotation → invoice (auto copy ข้อมูล)
```

---

## 10. FAQ สำหรับ PM

**Q: ลูกค้าบนมือถือใช้ได้ไหม?**  
A: ใช้ได้ผ่าน browser (responsive design) แต่ไม่มี native app ใน App Store

**Q: ทำงาน offline ได้ไหม?**  
A: ปัจจุบันต้องมี internet ทุก action เพราะ database อยู่บน Supabase cloud

**Q: PDF ส่ง LINE ได้ไหม?**  
A: บนมือถือ: download PDF → แชร์ผ่าน Web Share API → เลือก LINE ได้เลย

**Q: รองรับหลายบริษัทต่อ account ได้ไหม?**  
A: ปัจจุบัน: 1 account = 1 บริษัท ต้องออกแบบ multi-tenant ใหม่ถ้าต้องการ

**Q: integrate กับ LINE OA / Shopee / Lazada ได้ไหม?**  
A: ทำได้ผ่าน Supabase Edge Functions + Webhook แต่ยังไม่ได้วางแผน

---

*สร้างโดย: Engineering Team — อัปเดตเมื่อมี feature ใหม่เข้ามา*
