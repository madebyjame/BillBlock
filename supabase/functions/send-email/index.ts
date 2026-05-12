/**
 * send-email — Supabase Edge Function
 * Sends transactional email via Resend API.
 *
 * Required env vars (set in Supabase Dashboard → Settings → Edge Functions):
 *   RESEND_API_KEY   — from resend.com
 *   FROM_EMAIL       — e.g. "BillBlock <noreply@yourdomain.com>"
 *
 * Payload variants:
 *   { type: 'invoice',  to, data: { docNumber, docTypeLabel, customerName, companyName, portalUrl, message? } }
 *   { type: 'payment',  to, data: { docNumber, amount, companyName, paidDate } }
 *   { type: 'welcome',  to, data: { displayName } }
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Email templates ──────────────────────────────────────────────────────────

function invoiceTemplate(d: {
  docNumber: string
  docTypeLabel: string
  customerName?: string
  companyName?: string
  portalUrl?: string
  message?: string
}) {
  return {
    subject: `${d.docTypeLabel} ${d.docNumber}${d.companyName ? ` จาก ${d.companyName}` : ''}`,
    html: `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
    <div style="background:#1e3a8a;padding:32px 36px">
      <p style="margin:0;font-size:22px;font-weight:700;color:#fff">BillBlock</p>
      <p style="margin:4px 0 0;font-size:13px;color:#93c5fd">ระบบจัดการเอกสารทางธุรกิจ</p>
    </div>
    <div style="padding:36px">
      <p style="margin:0 0 16px;font-size:15px;color:#1e293b">
        ${d.customerName ? `เรียน คุณ${d.customerName}` : 'เรียน ลูกค้า'}
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.6">
        ขอส่ง<strong>${d.docTypeLabel} ${d.docNumber}</strong> มาพร้อมกับอีเมลฉบับนี้${d.message ? `<br><br>${d.message}` : ''}
      </p>
      ${d.portalUrl ? `
      <div style="text-align:center;margin:28px 0">
        <a href="${d.portalUrl}"
           style="display:inline-block;background:#1e3a8a;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600">
          ดูเอกสารออนไลน์
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center">
        หรือเปิดลิงก์: <a href="${d.portalUrl}" style="color:#3b82f6">${d.portalUrl}</a>
      </p>
      ` : ''}
    </div>
    <div style="background:#f1f5f9;padding:20px 36px;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">
        ${d.companyName ?? 'BillBlock'} · ส่งผ่าน BillBlock
      </p>
    </div>
  </div>
</body>
</html>`,
  }
}

function paymentTemplate(d: {
  docNumber: string
  amount: number
  companyName?: string
  paidDate?: string
}) {
  const fmtAmount = new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(d.amount)
  return {
    subject: `ยืนยันการชำระเงิน ${d.docNumber}${d.companyName ? ` — ${d.companyName}` : ''}`,
    html: `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
    <div style="background:#16a34a;padding:32px 36px">
      <p style="margin:0;font-size:22px;font-weight:700;color:#fff">✓ ชำระเงินสำเร็จ</p>
      <p style="margin:4px 0 0;font-size:13px;color:#bbf7d0">BillBlock Payment Confirmation</p>
    </div>
    <div style="padding:36px">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:8px 0;color:#64748b">เลขที่เอกสาร</td><td style="padding:8px 0;font-weight:600;text-align:right;color:#1e293b">${d.docNumber}</td></tr>
        <tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b">ยอดชำระ</td><td style="padding:8px 0;font-weight:700;text-align:right;color:#16a34a;font-size:18px">฿${fmtAmount}</td></tr>
        ${d.paidDate ? `<tr style="border-top:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b">วันที่ชำระ</td><td style="padding:8px 0;text-align:right;color:#1e293b">${d.paidDate}</td></tr>` : ''}
      </table>
    </div>
    <div style="background:#f1f5f9;padding:20px 36px;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">${d.companyName ?? 'BillBlock'} · ส่งผ่าน BillBlock</p>
    </div>
  </div>
</body>
</html>`,
  }
}

function welcomeTemplate(d: { displayName?: string }) {
  return {
    subject: 'ยินดีต้อนรับสู่ BillBlock 🎉',
    html: `
<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08)">
    <div style="background:#1e3a8a;padding:32px 36px">
      <p style="margin:0;font-size:22px;font-weight:700;color:#fff">BillBlock</p>
      <p style="margin:4px 0 0;font-size:13px;color:#93c5fd">ระบบจัดการเอกสารทางธุรกิจ</p>
    </div>
    <div style="padding:36px">
      <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#1e293b">
        ยินดีต้อนรับ${d.displayName ? ` คุณ${d.displayName}` : ''} 🎉
      </p>
      <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.7">
        บัญชีของคุณพร้อมใช้งานแล้ว เริ่มต้นด้วยการตั้งค่าโปรไฟล์ธุรกิจ
        แล้วสร้างเอกสารแรกได้เลย
      </p>
      <ul style="padding-left:20px;color:#475569;font-size:14px;line-height:2">
        <li>สร้างใบเสนอราคา ใบแจ้งหนี้ ใบเสร็จ</li>
        <li>จัดการลูกค้าและสินค้า</li>
        <li>ติดตามยอดขายและรายงาน</li>
      </ul>
    </div>
    <div style="background:#f1f5f9;padding:20px 36px;text-align:center">
      <p style="margin:0;font-size:12px;color:#94a3b8">BillBlock · ระบบจัดการเอกสารสำหรับธุรกิจไทย</p>
    </div>
  </div>
</body>
</html>`,
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const resendKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('FROM_EMAIL') ?? 'BillBlock <noreply@billblock.app>'

  if (!resendKey) {
    return json({ error: 'RESEND_API_KEY not configured' }, 503)
  }

  try {
    const body = await req.json()
    const { type, to, data } = body as {
      type: 'invoice' | 'payment' | 'welcome'
      to: string
      data: Record<string, unknown>
    }

    if (!type || !to) return json({ error: 'missing_fields' }, 400)

    let template: { subject: string; html: string }

    if (type === 'invoice') {
      template = invoiceTemplate(data as Parameters<typeof invoiceTemplate>[0])
    } else if (type === 'payment') {
      template = paymentTemplate(data as Parameters<typeof paymentTemplate>[0])
    } else if (type === 'welcome') {
      template = welcomeTemplate(data as Parameters<typeof welcomeTemplate>[0])
    } else {
      return json({ error: 'unknown_type' }, 400)
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    })

    const result = await res.json()
    if (!res.ok) {
      console.error('Resend error:', result)
      return json({ error: result.message ?? 'resend_error' }, 502)
    }

    return json({ id: result.id })
  } catch (err) {
    console.error(err)
    return json({ error: 'internal_error' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
