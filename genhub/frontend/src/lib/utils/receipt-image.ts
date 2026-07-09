'use client';

import type { ReceiptData } from '@/components/pos/Receipt';
import { bankShortName } from './vietqr';

// Vẽ hóa đơn ra ảnh PNG hoạt động ổn định trên mọi điện thoại (thay cho window.print()
// vốn hay lỗi trên Safari/Chrome mobile). Ảnh có thể chia sẻ qua Zalo/Messenger hoặc lưu về máy.

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  card: 'Thẻ',
  bank_transfer: 'Chuyển khoản',
};

function paymentLabel(method: string): string {
  return PAYMENT_LABEL[method] ?? method;
}

function fmtVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const FONT = "'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
const W = 420; // rộng logic, hợp khổ hóa đơn 80mm
const PAD = 24;
const SCALE = 2; // ảnh nét trên màn hình retina

// Vẽ toàn bộ hóa đơn, trả về chiều cao nội dung. Gọi 2 lần: đo trước rồi vẽ thật.
function paintReceipt(
  ctx: CanvasRenderingContext2D,
  data: ReceiptData,
  qrImg: HTMLImageElement | null,
): number {
  const left = PAD;
  const right = W - PAD;
  const cx = W / 2;
  const contentW = right - left;
  let y = PAD;

  ctx.textBaseline = 'top';

  const dashed = () => {
    y += 6;
    ctx.strokeStyle = '#c8c8c8';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(left, y + 0.5);
    ctx.lineTo(right, y + 0.5);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 12;
  };

  // Header
  ctx.fillStyle = '#111';
  ctx.textAlign = 'center';
  ctx.font = `bold 26px ${FONT}`;
  ctx.fillText(data.storeName ?? 'TINHUB POS', cx, y, contentW);
  y += 32;
  ctx.font = `13px ${FONT}`;
  ctx.fillStyle = '#666';
  ctx.fillText('HÓA ĐƠN BÁN HÀNG', cx, y);
  y += 20;

  dashed();

  // Two-column info row
  const infoRow = (label: string, value: string, bold = false) => {
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = '#666';
    ctx.textAlign = 'left';
    ctx.fillText(label, left, y);
    ctx.fillStyle = '#111';
    ctx.font = `${bold ? 'bold ' : ''}13px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(value, right, y, contentW * 0.62);
    y += 20;
  };

  ctx.textAlign = 'left';
  infoRow('Mã đơn', data.orderCode, true);
  infoRow('Ngày', fmtDate(data.createdAt));
  if (data.customerName) infoRow('Khách hàng', data.customerName);
  if (data.customerPhone) infoRow('SĐT', data.customerPhone);

  dashed();

  // Items
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    const priceText = fmtVND(item.lineTotal);
    ctx.font = `bold 13px ${FONT}`;
    const priceW = ctx.measureText(priceText).width;

    // Tên sản phẩm — tự xuống dòng nếu dài
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = '#111';
    ctx.textAlign = 'left';
    const nameMaxW = contentW - priceW - 12;
    const words = `${i + 1}. ${item.name}`.split(' ');
    let lineText = '';
    let firstLine = true;
    for (const word of words) {
      const test = lineText ? `${lineText} ${word}` : word;
      if (ctx.measureText(test).width > nameMaxW && lineText) {
        ctx.fillText(lineText, left, y);
        if (firstLine) {
          ctx.font = `bold 13px ${FONT}`;
          ctx.textAlign = 'right';
          ctx.fillText(priceText, right, y);
          ctx.font = `13px ${FONT}`;
          ctx.textAlign = 'left';
          firstLine = false;
        }
        y += 18;
        lineText = word;
      } else {
        lineText = test;
      }
    }
    ctx.fillText(lineText, left, y);
    if (firstLine) {
      ctx.font = `bold 13px ${FONT}`;
      ctx.textAlign = 'right';
      ctx.fillText(priceText, right, y);
      ctx.textAlign = 'left';
    }
    y += 18;

    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = '#999';
    ctx.fillText(`   ${item.quantity} × ${fmtVND(item.unitPrice)}`, left, y);
    y += 18;
  }

  dashed();

  // Totals
  const totalRow = (label: string, value: string, color = '#555') => {
    ctx.font = `13px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(label, left, y);
    ctx.textAlign = 'right';
    ctx.fillText(value, right, y);
    y += 20;
  };
  totalRow('Tạm tính', fmtVND(data.subtotal));
  if (data.discountAmount > 0) totalRow('Giảm giá', `-${fmtVND(data.discountAmount)}`, '#dc2626');

  y += 4;
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, y + 0.5);
  ctx.lineTo(right, y + 0.5);
  ctx.stroke();
  y += 10;

  ctx.font = `bold 18px ${FONT}`;
  ctx.fillStyle = '#111';
  ctx.textAlign = 'left';
  ctx.fillText('TỔNG CỘNG', left, y);
  ctx.fillStyle = '#FF6B35';
  ctx.textAlign = 'right';
  ctx.fillText(fmtVND(data.totalAmount), right, y);
  y += 26;

  dashed();

  // Payments
  for (const p of data.payments) {
    totalRow(paymentLabel(p.method), fmtVND(p.amount));
  }
  if (data.changeAmount > 0) {
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillStyle = '#111';
    ctx.textAlign = 'left';
    ctx.fillText('Tiền thừa', left, y);
    ctx.textAlign = 'right';
    ctx.fillText(fmtVND(data.changeAmount), right, y);
    y += 20;
  }

  // QR chuyển khoản
  if (qrImg && data.bank) {
    dashed();
    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.fillText('QUÉT MÃ ĐỂ CHUYỂN KHOẢN', cx, y);
    y += 20;
    const qrSize = 150;
    ctx.drawImage(qrImg, cx - qrSize / 2, y, qrSize, qrSize);
    y += qrSize + 8;
    ctx.font = `bold 13px ${FONT}`;
    ctx.fillStyle = '#111';
    ctx.fillText(data.bank.accountName, cx, y);
    y += 18;
    ctx.font = `12px ${FONT}`;
    ctx.fillStyle = '#666';
    ctx.fillText(`${bankShortName(data.bank.bin)} • ${data.bank.accountNumber}`, cx, y);
    y += 18;
  }

  dashed();

  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = '#888';
  ctx.textAlign = 'center';
  const footer = data.invoiceFooter?.trim() || 'Cảm ơn quý khách! Hẹn gặp lại.';
  ctx.fillText(footer, cx, y, contentW);
  y += 22;

  return y + PAD;
}

export async function renderReceiptToBlob(
  data: ReceiptData,
  qrDataUrl: string | null,
): Promise<Blob> {
  const qrImg = qrDataUrl ? await loadImage(qrDataUrl).catch(() => null) : null;

  // Lượt 1: đo chiều cao (vẽ lên canvas tạm, phần tràn bị cắt vô hại)
  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = W;
  measureCanvas.height = 10;
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) throw new Error('Canvas không khả dụng');
  const height = paintReceipt(measureCtx, data, qrImg);

  // Lượt 2: vẽ thật ở độ phân giải cao
  const canvas = document.createElement('canvas');
  canvas.width = W * SCALE;
  canvas.height = Math.ceil(height) * SCALE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas không khả dụng');
  ctx.scale(SCALE, SCALE);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, height);
  paintReceipt(ctx, data, qrImg);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Không tạo được ảnh'))),
      'image/png',
    );
  });
}
