'use client';

import { useAuthStore } from '@/lib/stores/auth.store';

export interface ReceiptItem {
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReceiptPayment {
  method: string;
  amount: number;
}

export interface ReceiptData {
  orderCode: string;
  createdAt: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  payments: ReceiptPayment[];
  changeAmount: number;
  customerName?: string | null;
  customerPhone?: string | null;
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  card: 'Thẻ',
  bank_transfer: 'Chuyển khoản',
};

function paymentLabel(method: string): string {
  return PAYMENT_LABEL[method] ?? method;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDateVN(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

interface ReceiptProps {
  data: ReceiptData;
  onNewOrder: () => void;
  onClose: () => void;
}

function buildReceiptHTML(data: ReceiptData, storeName: string): string {
  const itemRows = data.items
    .map(
      (item, i) => `
      <tr>
        <td style="padding:3px 2px;text-align:center;">${i + 1}</td>
        <td style="padding:3px 2px;">${item.name}</td>
        <td style="padding:3px 2px;text-align:center;">${item.quantity}</td>
        <td style="padding:3px 2px;text-align:right;">${formatVND(item.unitPrice)}</td>
        <td style="padding:3px 2px;text-align:right;">${formatVND(item.lineTotal)}</td>
      </tr>`,
    )
    .join('');

  const discountRow =
    data.discountAmount > 0
      ? `<tr>
          <td style="color:#888;">Giảm giá:</td>
          <td style="text-align:right;color:#e74c3c;">-${formatVND(data.discountAmount)}</td>
        </tr>`
      : '';

  const paymentRows = data.payments
    .map(
      (p) => `
      <tr>
        <td style="color:#888;">${paymentLabel(p.method)}:</td>
        <td style="text-align:right;">${formatVND(p.amount)}</td>
      </tr>`,
    )
    .join('');

  const changeRow =
    data.changeAmount > 0
      ? `<tr>
          <td style="color:#888;">Tiền thừa:</td>
          <td style="text-align:right;font-weight:600;">${formatVND(data.changeAmount)}</td>
        </tr>`
      : '';

  const customerRows = [
    data.customerName
      ? `<tr><td style="color:#888;">Khách hàng:</td><td style="text-align:right;font-weight:500;">${data.customerName}</td></tr>`
      : '',
    data.customerPhone
      ? `<tr><td style="color:#888;">SĐT:</td><td style="text-align:right;">${data.customerPhone}</td></tr>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Hóa đơn ${data.orderCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: 80mm;
      margin: 0 auto;
      padding: 8px;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .store-name { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
    .dashed { border-top: 1px dashed #555; margin: 8px 0; }
    table { width: 100%; border-collapse: collapse; }
    .info-table td { padding: 2px 0; vertical-align: top; }
    .items-table th {
      padding: 3px 2px;
      border-bottom: 1px solid #ccc;
      font-size: 11px;
    }
    .items-table td { font-size: 11px; vertical-align: top; }
    .totals-table td { padding: 3px 0; }
    .total-row td { font-size: 15px; font-weight: bold; border-top: 1px solid #333; padding-top: 6px; }
    .footer { text-align: center; color: #555; margin-top: 8px; font-size: 12px; }
    @media print {
      body { width: 80mm; }
    }
  </style>
</head>
<body>
  <div class="center">
    <div class="store-name">${storeName}</div>
    <div style="font-size:11px;color:#555;margin-top:2px;">HÓA ĐƠN BÁN HÀNG</div>
  </div>

  <div class="dashed"></div>

  <table class="info-table">
    <tr>
      <td style="color:#888;">Mã đơn:</td>
      <td style="text-align:right;font-weight:600;">${data.orderCode}</td>
    </tr>
    <tr>
      <td style="color:#888;">Ngày:</td>
      <td style="text-align:right;">${formatDateVN(data.createdAt)}</td>
    </tr>
    ${customerRows}
  </table>

  <div class="dashed"></div>

  <table class="items-table">
    <thead>
      <tr>
        <th style="text-align:center;width:20px;">STT</th>
        <th style="text-align:left;">Tên SP</th>
        <th style="text-align:center;width:24px;">SL</th>
        <th style="text-align:right;width:60px;">Đơn giá</th>
        <th style="text-align:right;width:65px;">T.Tiền</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="dashed"></div>

  <table class="totals-table">
    <tr>
      <td style="color:#888;">Tạm tính:</td>
      <td style="text-align:right;">${formatVND(data.subtotal)}</td>
    </tr>
    ${discountRow}
    <tr class="total-row">
      <td>Tổng cộng:</td>
      <td style="text-align:right;">${formatVND(data.totalAmount)}</td>
    </tr>
  </table>

  <div class="dashed"></div>

  <table class="totals-table">
    ${paymentRows}
    ${changeRow}
  </table>

  <div class="dashed"></div>

  <div class="footer">Cảm ơn quý khách! Hẹn gặp lại.</div>
</body>
</html>`;
}

export default function Receipt({ data, onNewOrder, onClose }: ReceiptProps) {
  const user = useAuthStore((s) => s.user);
  const storeName = user?.store?.name ?? 'GENHUB POS';

  const handlePrint = () => {
    const html = buildReceiptHTML(data, storeName);
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert('Trình duyệt đã chặn cửa sổ popup. Vui lòng cho phép popup và thử lại.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for content to load then trigger print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl max-w-sm w-full max-h-[90vh] overflow-y-auto shadow-xl"
      >
        {/* Receipt preview */}
        <div className="p-5 text-center font-mono text-sm">
          {/* Store info */}
          <h2 className="text-base font-bold tracking-wide">{storeName}</h2>
          <p className="text-xs text-gray-400 mt-0.5">HÓA ĐƠN BÁN HÀNG</p>

          <div className="border-t border-dashed my-3" />

          {/* Order info */}
          <div className="text-xs space-y-1 text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Mã đơn:</span>
              <span className="font-semibold">{data.orderCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ngày:</span>
              <span>{formatDateVN(data.createdAt)}</span>
            </div>
            {data.customerName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Khách hàng:</span>
                <span className="font-medium">{data.customerName}</span>
              </div>
            )}
            {data.customerPhone && (
              <div className="flex justify-between">
                <span className="text-gray-500">SĐT:</span>
                <span>{data.customerPhone}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed my-3" />

          {/* Items table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-center py-1 font-semibold w-6">STT</th>
                <th className="text-left py-1 font-semibold">Tên SP</th>
                <th className="text-center py-1 font-semibold w-6">SL</th>
                <th className="text-right py-1 font-semibold">Đơn giá</th>
                <th className="text-right py-1 font-semibold">T.Tiền</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, i) => (
                <tr key={i} className="border-b border-dotted border-gray-200">
                  <td className="text-center py-1">{i + 1}</td>
                  <td
                    className="text-left py-1 pr-1"
                    style={{ maxWidth: '90px', wordBreak: 'break-word' }}
                  >
                    {item.name}
                  </td>
                  <td className="text-center py-1">{item.quantity}</td>
                  <td className="text-right py-1 whitespace-nowrap">{formatVND(item.unitPrice)}</td>
                  <td className="text-right py-1 whitespace-nowrap">{formatVND(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="border-t border-dashed my-3" />

          {/* Totals */}
          <div className="space-y-1 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-gray-500">Tạm tính:</span>
              <span>{formatVND(data.subtotal)}</span>
            </div>
            {data.discountAmount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Giảm giá:</span>
                <span>-{formatVND(data.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-1.5 mt-1">
              <span>Tổng cộng:</span>
              <span>{formatVND(data.totalAmount)}</span>
            </div>
          </div>

          <div className="border-t border-dashed my-3" />

          {/* Payments */}
          <div className="space-y-1 text-xs text-left">
            {data.payments.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-gray-500">{paymentLabel(p.method)}:</span>
                <span className="font-medium">{formatVND(p.amount)}</span>
              </div>
            ))}
            {data.changeAmount > 0 && (
              <div className="flex justify-between font-semibold">
                <span>Tiền thừa:</span>
                <span>{formatVND(data.changeAmount)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed my-3" />

          <p className="text-xs text-gray-400 text-center">Cảm ơn quý khách! Hẹn gặp lại.</p>
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 border border-[#FF6B35] text-[#FF6B35] rounded-xl font-medium hover:bg-orange-50 transition-colors text-sm"
          >
            In hóa đơn
          </button>
          <button
            onClick={onNewOrder}
            className="flex-1 py-2.5 bg-[#FF6B35] text-white rounded-xl font-medium hover:bg-[#E55A2B] transition-colors text-sm"
          >
            Đơn mới
          </button>
        </div>
      </div>
    </div>
  );
}
