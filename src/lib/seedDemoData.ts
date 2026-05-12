/**
 * seedDemoData — creates one sample customer and one sample product
 * for new users who click "ใช้ตัวอย่างแทน" in the Quick Setup Bar.
 * Safe to call multiple times: skips if data already exists.
 */
import { supabase } from './supabase'

export async function seedDemoData(userId: string): Promise<void> {
  const [custRes, prodRes] = await Promise.all([
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  const tasks: PromiseLike<unknown>[] = []

  if ((custRes.count ?? 0) === 0) {
    tasks.push(
      supabase.from('customers').insert({
        user_id: userId,
        name: 'บริษัท ลูกค้าตัวอย่าง จำกัด',
        address: '123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110',
        tax_id: '0000000000001',
        email: 'sample.customer@example.com',
        phone: '02-100-0001',
        contact_person: 'คุณสมชาย ตัวอย่าง',
        status: 'active',
        tags: [],
        billing_address: '',
        shipping_address: '',
        credit_term: '30',
        salesperson: '',
      }).then(),
    )
  }

  if ((prodRes.count ?? 0) === 0) {
    tasks.push(
      supabase.from('products').insert({
        user_id: userId,
        name: 'บริการที่ปรึกษาตัวอย่าง',
        description: 'สินค้า/บริการตัวอย่างสำหรับทดลองออกเอกสาร',
        price: 5000,
        unit: 'ชิ้น',
        stock: 999,
        category: '',
        sku: 'DEMO-001',
        cost_price: 0,
        min_stock: 0,
        tax_type: 'vat',
        image_url: '',
      }).then(),
    )
  }

  if (tasks.length > 0) await Promise.all(tasks)
}
