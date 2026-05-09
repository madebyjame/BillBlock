import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TermsPage() {
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
          <h1 className="mb-2 text-2xl font-bold text-slate-800">เงื่อนไขการใช้บริการ</h1>
          <p className="mb-8 text-sm text-slate-400">อัปเดตล่าสุด: 9 พฤษภาคม 2569</p>

          <div className="space-y-7 text-sm leading-relaxed text-slate-600">

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">1. การยอมรับเงื่อนไข</h2>
              <p>การลงทะเบียนหรือใช้บริการ BillBlock ("บริการ") ถือว่าท่านได้อ่าน เข้าใจ และยอมรับเงื่อนไขการใช้บริการฉบับนี้ทุกประการ หากท่านไม่ยอมรับ กรุณางดใช้บริการ</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">2. ลักษณะบริการ</h2>
              <p>BillBlock เป็นระบบออกเอกสารทางธุรกิจออนไลน์ (SaaS) สำหรับธุรกิจไทย ให้บริการสร้างใบแจ้งหนี้ ใบเสนอราคา ใบเสร็จรับเงิน และเอกสารธุรกิจอื่นๆ พร้อมระบบรับชำระเงินผ่าน PromptPay และ Customer Portal</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">3. บัญชีผู้ใช้</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>ท่านต้องมีอายุไม่ต่ำกว่า 20 ปีบริบูรณ์ หรือได้รับความยินยอมจากผู้ปกครองตามกฎหมาย</li>
                <li>ท่านต้องระบุข้อมูลที่ถูกต้องและเป็นปัจจุบันเสมอ</li>
                <li>ท่านรับผิดชอบการรักษาความลับของรหัสผ่านและการกระทำทั้งหมดภายใต้บัญชีของท่าน</li>
                <li>BillBlock สงวนสิทธิ์ระงับหรือยกเลิกบัญชีที่ละเมิดเงื่อนไขนี้</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">4. แผนบริการและการชำระเงิน</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>บริการมี 3 ระดับ: Free, Pro (฿299/เดือน), Max (฿599/เดือน)</li>
                <li>ค่าบริการชำระล่วงหน้าเป็นรายเดือน ไม่มีการคืนเงินตามสัดส่วน</li>
                <li>การยกเลิก Subscription จะมีผลเมื่อสิ้นสุดรอบบิลปัจจุบัน</li>
                <li>BillBlock ขอสงวนสิทธิ์ปรับราคาโดยแจ้งล่วงหน้าไม่น้อยกว่า 30 วัน</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">5. การใช้บริการที่ยอมรับได้</h2>
              <p className="mb-2">ท่านตกลงที่จะไม่:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>ใช้บริการเพื่อวัตถุประสงค์ที่ผิดกฎหมาย ฉ้อโกง หรือสร้างเอกสารปลอม</li>
                <li>พยายามเข้าถึงข้อมูลของผู้ใช้รายอื่น</li>
                <li>ทำวิศวกรรมย้อนกลับ (reverse engineer) หรือคัดลอกระบบ</li>
                <li>ส่ง spam หรือเนื้อหาที่เป็นอันตรายผ่านระบบ</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">6. ทรัพย์สินทางปัญญา</h2>
              <p>ซอฟต์แวร์ ดีไซน์ โลโก้ และเนื้อหาทั้งหมดบน BillBlock เป็นทรัพย์สินของ BillBlock และได้รับการคุ้มครองโดยกฎหมายลิขสิทธิ์ไทย ท่านได้รับสิทธิ์ใช้งานแบบจำกัดและไม่สามารถโอนสิทธิ์ได้</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">7. ข้อมูลของผู้ใช้</h2>
              <p>ท่านเป็นเจ้าของข้อมูลทั้งหมดที่ท่านอัปโหลดหรือสร้างบนบริการ BillBlock จะไม่อ้างสิทธิ์ความเป็นเจ้าของ แต่ท่านอนุญาตให้ BillBlock ใช้ข้อมูลเพื่อให้บริการแก่ท่านเท่านั้น</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">8. การจำกัดความรับผิด</h2>
              <p>BillBlock ให้บริการ "ตามสภาพที่เป็น" (as-is) และไม่รับประกันความพร้อมใช้งาน 100% ความรับผิดสูงสุดของ BillBlock จำกัดไม่เกินค่าบริการที่ท่านชำระในช่วง 3 เดือนที่ผ่านมา</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">9. การยุติบริการ</h2>
              <p>BillBlock ขอสงวนสิทธิ์ยุติ ระงับ หรือปรับเปลี่ยนบริการได้ตลอดเวลาโดยอาจแจ้งหรือไม่แจ้งล่วงหน้า ในกรณียุติบริการ BillBlock จะพยายามให้ท่านดาวน์โหลดข้อมูลก่อนไม่น้อยกว่า 30 วัน</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">10. กฎหมายที่ใช้บังคับ</h2>
              <p>เงื่อนไขนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทใดๆ อยู่ในเขตอำนาจของศาลไทย</p>
            </section>

            <section>
              <h2 className="mb-2 font-semibold text-slate-800">11. ติดต่อเรา</h2>
              <p>หากมีคำถามเกี่ยวกับเงื่อนไขนี้ ติดต่อ: <a href="mailto:support@billblock.app" className="text-[#1e3a8a] underline">support@billblock.app</a></p>
            </section>

          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
          <Link to="/"       className="hover:text-slate-600 transition-colors">หน้าหลัก</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-slate-600 transition-colors">นโยบายความเป็นส่วนตัว</Link>
          <span>·</span>
          <Link to="/refund"  className="hover:text-slate-600 transition-colors">นโยบายการคืนเงิน</Link>
        </div>
      </div>
    </div>
  )
}
