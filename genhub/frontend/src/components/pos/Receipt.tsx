'use client';

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
  storeName?: string;
}

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
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildPrintHTML(data: ReceiptData): string {
  const store = data.storeName ?? 'GENHUB POS';

  const items = data.items
    .map(
      (it, i) => `
      <tr>
        <td style="padding:4px 0;vertical-align:top;">${i + 1}</td>
        <td style="padding:4px 6px;vertical-align:top;">${esc(it.name)}</td>
        <td style="padding:4px 0;text-align:center;vertical-align:top;">${it.quantity}</td>
        <td style="padding:4px 0;text-align:right;vertical-align:top;">${fmtVND(it.unitPrice)}</td>
        <td style="padding:4px 0;text-align:right;vertical-align:top;font-weight:600;">${fmtVND(it.lineTotal)}</td>
      </tr>`,
    )
    .join('');

  const discount =
    data.discountAmount > 0
      ? `<tr><td colspan="4">Giảm giá</td><td style="text-align:right;color:#dc2626;">-${fmtVND(data.discountAmount)}</td></tr>`
      : '';

  const payments = data.payments
    .map((p) => `<div style="display:flex;justify-content:space-between;"><span>${esc(paymentLabel(p.method))}</span><span>${fmtVND(p.amount)}</span></div>`)
    .join('');

  const change =
    data.changeAmount > 0
      ? `<div style="display:flex;justify-content:space-between;font-weight:600;"><span>Tiền thừa</span><span>${fmtVND(data.changeAmount)}</span></div>`
      : '';

  const customer = [
    data.customerName ? `<div style="display:flex;justify-content:space-between;"><span>Khách hàng</span><span style="font-weight:500;">${esc(data.customerName)}</span></div>` : '',
    data.customerPhone ? `<div style="display:flex;justify-content:space-between;"><span>SĐT</span><span>${esc(data.customerPhone)}</span></div>` : '',
  ].filter(Boolean).join('');

  return `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/><title>Hóa đơn ${esc(data.orderCode)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;font-size:13px;width:80mm;margin:0 auto;padding:10px 8px 16px;color:#111;background:#fff;line-height:1.5}
.header{text-align:center;margin-bottom:8px}
.store-name{font-size:18px;font-weight:700;letter-spacing:0.5px}
.subtitle{font-size:11px;color:#666;margin-top:2px}
.sep{border:none;border-top:1px dashed #999;margin:8px 0}
.info{font-size:12px}
.info div{display:flex;justify-content:space-between;padding:2px 0}
.info .label{color:#666}
table{width:100%;border-collapse:collapse;font-size:12px}
thead th{text-align:left;padding:4px 0;border-bottom:1px solid #ccc;font-weight:600;font-size:11px;color:#555}
thead th:last-child,thead th:nth-child(4){text-align:right}
thead th:nth-child(3){text-align:center}
.totals div{display:flex;justify-content:space-between;padding:2px 0;font-size:12px}
.grand-total{font-size:16px;font-weight:700;border-top:2px solid #111;padding-top:6px;margin-top:4px;display:flex;justify-content:space-between}
.payments div{display:flex;justify-content:space-between;padding:2px 0;font-size:12px}
.footer{text-align:center;color:#888;font-size:11px;margin-top:10px}
@media print{body{width:80mm;margin:0;padding:8px 6px 12px}}
</style></head><body>
<div class="header">
  <div class="store-name">${esc(store)}</div>
  <div class="subtitle">HÓA ĐƠN BÁN HÀNG</div>
</div>
<hr class="sep"/>
<div class="info">
  <div><span class="label">Mã đơn:</span><span style="font-weight:600">${esc(data.orderCode)}</span></div>
  <div><span class="label">Ngày:</span><span>${fmtDate(data.createdAt)}</span></div>
  ${customer}
</div>
<hr class="sep"/>
<table>
  <thead><tr><th>#</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>T.Tiền</th></tr></thead>
  <tbody>${items}</tbody>
</table>
<hr class="sep"/>
<div class="totals">
  <div><span>Tạm tính</span><span>${fmtVND(data.subtotal)}</span></div>
  ${discount}
</div>
<div class="grand-total"><span>TỔNG CỘNG</span><span>${fmtVND(data.totalAmount)}</span></div>
<hr class="sep"/>
<div class="payments">
  ${payments}
  ${change}
</div>
<hr class="sep"/>
<div class="footer">Cảm ơn quý khách! Hẹn gặp lại.</div>
</body></html>`;
}

interface ReceiptProps {
  data: ReceiptData;
  onNewOrder: () => void;
  onClose: () => void;
}

export default function Receipt({ data, onNewOrder, onClose }: ReceiptProps) {
  const storeName = data.storeName ?? 'GENHUB POS';

  const handlePrint = () => {
    const html = buildPrintHTML(data);
    const existing = document.getElementById('receipt-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'receipt-print-frame';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        setTimeout(() => iframe.remove(), 2000);
      }
    };
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Receipt preview */}
        <div className="p-5 space-y-3">
          <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Đơn hàng đã được tạo thành công.
          </div>

          {/* Header */}
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-wide">{storeName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">HÓA ĐƠN BÁN HÀNG</p>
          </div>

          <div className="border-t border-dashed border-gray-300" />

          {/* Order info */}
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Mã đơn</span>
              <span className="font-semibold">{data.orderCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ngày</span>
              <span>{fmtDate(data.createdAt)}</span>
            </div>
            {data.customerName && (
              <div className="flex justify-between">
                <span className="text-gray-500">Khách hàng</span>
                <span className="font-medium">{data.customerName}</span>
              </div>
            )}
            {data.customerPhone && (
              <div className="flex justify-between">
                <span className="text-gray-500">SĐT</span>
                <span>{data.customerPhone}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300" />

          {/* Items */}
          <div className="space-y-2">
            {data.items.map((item, i) => (
              <div key={`${item.name}-${i}`} className="text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{i + 1}. {item.name}</span>
                  <span className="font-semibold ml-2 whitespace-nowrap">{fmtVND(item.lineTotal)}</span>
                </div>
                <div className="text-xs text-gray-400 ml-4">
                  {item.quantity} × {fmtVND(item.unitPrice)}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-gray-300" />

          {/* Totals */}
          <div className="text-sm space-y-1">
            <div className="flex justify-between text-gray-500">
              <span>Tạm tính</span>
              <span>{fmtVND(data.subtotal)}</span>
            </div>
            {data.discountAmount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Giảm giá</span>
                <span>-{fmtVND(data.discountAmount)}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center font-bold text-lg border-t-2 border-gray-800 pt-2">
            <span>TỔNG CỘNG</span>
            <span className="text-[#FF6B35]">{fmtVND(data.totalAmount)}</span>
          </div>

          <div className="border-t border-dashed border-gray-300" />

          {/* Payments */}
          <div className="text-sm space-y-1">
            {data.payments.map((p, i) => (
              <div key={`${p.method}-${i}`} className="flex justify-between">
                <span className="text-gray-500">{paymentLabel(p.method)}</span>
                <span className="font-medium">{fmtVND(p.amount)}</span>
              </div>
            ))}
            {data.changeAmount > 0 && (
              <div className="flex justify-between font-semibold">
                <span>Tiền thừa</span>
                <span>{fmtVND(data.changeAmount)}</span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-gray-300" />

          <p className="text-center text-xs text-gray-400">Cảm ơn quý khách! Hẹn gặp lại.</p>
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
