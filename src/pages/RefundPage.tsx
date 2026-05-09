import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function RefundPage() {
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
          <h1 className="mb-2 text-2xl font-bold text-slate-800">นโยบายการคืนเงิน</h1>
          <p className="mb-8 text-sm text-slate-400">อัปเดตล่าสุด: 9 พฤษภาคม 2569</p>

          <div className="space-y-7 text-sm leading-relaxed text-slate-600">

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">1. ภาพรวมนโยบาย</h2>
              <p>BillBlock มุ่งมั่นให้บริการที่มีคุณภาพ หากท่านไม่พึงพอใจในบริการ เรายินดีพิจารณาคำขอคืนเงินตามเงื่อนไขด้านล่าง</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">2. กรณีที่มีสิทธิ์ขอคืนเงิน</h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>ระยะทดลองใช้ 7 วัน:</strong> ท่านสามารถขอคืนเงินเต็มจำนวนภายใน 7 วันนับจากวันชำระเงินครั้งแรก โดยไม่ต้องระบุเหตุผล
                </li>
                <li>
                  <strong>ข้อผิดพลาดทางเทคนิค:</strong> หากบริการไม่สามารถใช้งานได้เกิน 72 ชั่วโมงติดต่อกันเนื่องจากปัญหาจากฝั่ง BillBlock ท่านมีสิทธิ์ขอคืนเงินตามสัดส่วนระยะเวลาที่ไม่ได้รับบริการ
                </li>
                <li>
                  <strong>การเรียกเก็บเงินซ้ำซ้อน:</strong> หากถูกเรียกเก็บเงินเกินกว่าที่ควรจะเป็น จะได้รับคืนเต็มจำนวนในส่วนที่เกิน
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">3. กรณีที่ไม่สามารถขอคืนเงินได้</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>หลังพ้น 7 วันนับจากวันชำระเงิน (ยกเว้นกรณีข้อผิดพลาดทางเทคนิค)</li>
                <li>การยกเลิก Subscription กลางรอบบิล — บริการยังคงใช้ได้จนสิ้นสุดรอบที่ชำระแล้ว</li>
                <li>กรณีละเมิดเงื่อนไขการใช้บริการ</li>
                <li>แผน Free ไม่มีค่าบริการ จึงไม่มีการคืนเงิน</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">4. วิธีขอคืนเงิน</h2>
              <ol className="list-decimal space-y-2 pl-5">
                <li>ส่งอีเมลมาที่ <a href="mailto:billing@billblock.app" className="text-[#1e3a8a] underline">billing@billblock.app</a></li>
                <li>ระบุอีเมลบัญชี, วันที่ชำระเงิน, และเหตุผลในการขอคืน</li>
                <li>ทีมงานจะตอบกลับภายใน 2 วันทำการ</li>
                <li>เงินจะคืนผ่านช่องทางเดิมที่ชำระ ภายใน 5–10 วันทำการหลังอนุมัติ</li>
              </ol>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">5. การยกเลิก Subscription</h2>
              <p>ท่านสามารถยกเลิก Subscription ได้ตลอดเวลาผ่าน Settings → แผน & Billing → ยกเลิกการสมัคร การยกเลิกมีผลเมื่อสิ้นสุดรอบบิลปัจจุบัน ข้อมูลของท่านจะถูกเก็บไว้ 90 วันหลังยกเลิก</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">6. การอัปเกรด / ดาวน์เกรด</h2>
              <p>การอัปเกรดแผนจะมีผลทันทีและคิดค่าบริการตามสัดส่วนที่เหลือของรอบบิล การดาวน์เกรดจะมีผลในรอบบิลถัดไป ไม่มีการคืนเงินส่วนต่างจากการดาวน์เกรด</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">7. ติดต่อฝ่ายบริการลูกค้า</h2>
              <p>
                อีเมล: <a href="mailto:billing@billblock.app" className="text-[#1e3a8a] underline">billing@billblock.app</a><br />
                เวลาทำการ: จันทร์–ศุกร์ 09:00–18:00 น. (เวลาไทย)<br />
                เป้าหมายการตอบกลับ: ภายใน 2 วันทำการ
              </p>
            </section>

          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
          <Link to="/"       className="hover:text-slate-600 transition-colors">หน้าหลัก</Link>
          <span>·</span>
          <Link to="/terms"  className="hover:text-slate-600 transition-colors">เงื่อนไขการใช้บริการ</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-slate-600 transition-colors">นโยบายความเป็นส่วนตัว</Link>
        </div>
      </div>
    </div>
  )
}
