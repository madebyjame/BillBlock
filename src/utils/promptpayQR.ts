// PromptPay EMV QR Code string builder (Thai QR Payment standard)

function tlv(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, '0')}${value}`
}

function crc16ccitt(str: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1)
      crc &= 0xFFFF
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function normalizePromptPayId(id: string): string {
  const clean = id.replace(/[-\s]/g, '')
  // Thai mobile: 0XXXXXXXXX → 0066XXXXXXXXX
  if (/^0[689]\d{8}$/.test(clean)) return `0066${clean.slice(1)}`
  // Already international format 66XXXXXXXXX
  if (/^66\d{9}$/.test(clean)) return `00${clean}`
  // National ID (13 digits) — used as-is
  return clean
}

export function buildPromptPayString(promptpayId: string, amount?: number): string {
  const normalizedId = normalizePromptPayId(promptpayId.trim())
  const merchantAccount = tlv('00', 'A000000677010111') + tlv('01', normalizedId)

  let payload =
    tlv('00', '01') +
    tlv('01', amount !== undefined && amount > 0 ? '12' : '11') +
    tlv('29', merchantAccount) +
    tlv('52', '0000') +
    tlv('53', '764') +
    (amount !== undefined && amount > 0 ? tlv('54', amount.toFixed(2)) : '') +
    tlv('58', 'TH') +
    '6304'

  return payload + crc16ccitt(payload)
}
