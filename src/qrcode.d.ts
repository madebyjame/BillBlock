declare module 'qrcode' {
  interface QRCodeToDataURLOptions {
    width?: number
    margin?: number
    color?: { dark?: string; light?: string }
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  }
  function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>
  function toCanvas(canvas: HTMLCanvasElement, text: string, options?: QRCodeToDataURLOptions): Promise<void>
}
