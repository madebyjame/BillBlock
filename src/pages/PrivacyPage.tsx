import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a8a]">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <Link to="/" className="text-lg font-bold text-[#1e3a8a]">BillBlock</Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-slate-800">นโยบายความเป็นส่วนตัว</h1>
          <p className="mb-8 text-sm text-slate-400">อัปเดตล่าสุด: 9 พฤษภาคม 2569</p>

          <div className="space-y-7 text-sm leading-relaxed text-slate-600">

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">1. บทนำ</h2>
              <p>BillBlock ("เรา", "บริษัท") ให้ความสำคัญกับความเป็นส่วนตัวของท่านอย่างสูงสุด นโยบายนี้อธิบายว่าเราเก็บรวบรวม ใช้ และคุ้มครองข้อมูลส่วนบุคคลของท่านอย่างไร ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">2. ข้อมูลที่เราเก็บรวบรวม</h2>
              <p className="mb-2">เราเก็บข้อมูลต่อไปนี้เมื่อท่านใช้บริการ:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>ข้อมูลบัญชี:</strong> อีเมล รหัสผ่าน (เข้ารหัส) ชื่อบริษัท</li>
                <li><strong>ข้อมูลธุรกิจ:</strong> เอกสาร ข้อมูลลูกค้า สินค้า และข้อมูลทางการเงินที่ท่านกรอก</li>
                <li><strong>ข้อมูลการชำระเงิน:</strong> ประวัติการสมัคร Subscription (ไม่เก็บข้อมูลบัตรเครดิตโดยตรง)</li>
                <li><strong>ข้อมูลการใช้งาน:</strong> Log การเข้าใช้งาน, IP Address, ประเภทอุปกรณ์</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">3. วัตถุประสงค์การใช้ข้อมูล</h2>
              <p className="mb-2">เราใช้ข้อมูลของท่านเพื่อ:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>ให้บริการและปรับปรุงฟีเจอร์ของ BillBlock</li>
                <li>ส่งการแจ้งเตือนที่จำเป็น (ยืนยันอีเมล รีเซ็ตรหัสผ่าน)</li>
                <li>จัดการการเรียกเก็บเงิน Subscription</li>
                <li>วิเคราะห์การใช้งานเพื่อปรับปรุงบริการ (ข้อมูล Aggregated)</li>
                <li>ปฏิบัติตามกฎหมายและข้อกำหนดของหน่วยงานกำกับดูแล</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">4. การเปิดเผยข้อมูลต่อบุคคลที่สาม</h2>
              <p className="mb-2">เราอาจแบ่งปันข้อมูลกับ:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>Supabase:</strong> ผู้ให้บริการ Database และ Authentication (เซิร์ฟเวอร์ใน Singapore)</li>
                <li><strong>Omise:</strong> ผู้ให้บริการชำระเงิน (สำหรับ PromptPay Subscription)</li>
                <li><strong>Vercel:</strong> ผู้ให้บริการ Hosting</li>
                <li>หน่วยงานกฎหมายเมื่อได้รับหมายศาลหรือคำสั่งทางกฎหมาย</li>
              </ul>
              <p className="mt-2">เราไม่ขายข้อมูลส่วนบุคคลของท่านให้บุคคลที่สาม</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">5. การรักษาความปลอดภัย</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>ข้อมูลทั้งหมดเข้ารหัสด้วย TLS ระหว่างการส่ง</li>
                <li>รหัสผ่านถูก hash ด้วย bcrypt</li>
                <li>Row-Level Security (RLS) ใน Database ป้องกันการเข้าถึงข้ามบัญชี</li>
                <li>บัญชีที่ไม่ได้ใช้งานเกิน 2 ปีอาจถูกลบโดยอัตโนมัติ</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">6. สิทธิ์ของท่านตาม PDPA</h2>
              <p className="mb-2">ท่านมีสิทธิ์:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li><strong>เข้าถึง:</strong> ขอดูข้อมูลส่วนบุคคลที่เราเก็บ</li>
                <li><strong>แก้ไข:</strong> ขอให้แก้ไขข้อมูลที่ไม่ถูกต้อง</li>
                <li><strong>ลบ:</strong> ขอลบข้อมูลส่วนบุคคล (Right to be Forgotten)</li>
                <li><strong>โอนย้าย:</strong> ขอรับข้อมูลในรูปแบบที่อ่านได้ด้วยเครื่อง</li>
                <li><strong>คัดค้าน:</strong> คัดค้านการประมวลผลข้อมูลในบางกรณี</li>
              </ul>
              <p className="mt-2">ติดต่อใช้สิทธิ์: <a href="mailto:privacy@billblock.app" className="text-[#1e3a8a] underline">privacy@billblock.app</a></p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">7. Cookies</h2>
              <p>เราใช้ Cookie ที่จำเป็นสำหรับการ Authentication และ Session ไม่มีการใช้ Tracking Cookie เพื่อโฆษณา</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">8. การเก็บรักษาข้อมูล</h2>
              <p>เราเก็บข้อมูลตราบเท่าที่บัญชีท่านยังใช้งานอยู่ หรือตามที่กฎหมายกำหนด เมื่อท่านลบบัญชี ข้อมูลส่วนตัวจะถูกลบภายใน 90 วัน</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">9. การเปลี่ยนแปลงนโยบาย</h2>
              <p>หากมีการเปลี่ยนแปลงสาระสำคัญ เราจะแจ้งทางอีเมลล่วงหน้าไม่น้อยกว่า 14 วัน</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">10. ติดต่อเรา</h2>
              <p>ผู้ควบคุมข้อมูลส่วนบุคคล: BillBlock<br />อีเมล: <a href="mailto:privacy@billblock.app" className="text-[#1e3a8a] underline">privacy@billblock.app</a></p>
            </section>

          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
          <Link to="/"      className="hover:text-slate-600 transition-colors">หน้าหลัก</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-slate-600 transition-colors">เงื่อนไขการใช้บริการ</Link>
          <span>·</span>
          <Link to="/refund" className="hover:text-slate-600 transition-colors">นโยบายการคืนเงิน</Link>
        </div>
      </div>
    </div>
  )
}
