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
  cash: 'Tien mat',
  card: 'The',
  bank_transfer: 'Chuyen khoan',
};

function paymentLabel(method: string): string {
  return PAYMENT_LABEL[method] ?? method;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'd';
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

/** Pad a string on the right to fill `width` characters */
function padEnd(str: string, width: number): string {
  if (str.length >= width) return str.slice(0, width);
  return str + ' '.repeat(width - str.length);
}

/** Pad a string on the left to fill `width` characters */
function padStart(str: string, width: number): string {
  if (str.length >= width) return str.slice(0, width);
  return ' '.repeat(width - str.length) + str;
}

const RECEIPT_WIDTH = 32; // characters wide (58mm paper ~32 chars at 12px mono)

function buildReceiptHTML(data: ReceiptData): string {
  const storeName = data.storeName ?? 'GENHUB POS';
  const dash = '-'.repeat(RECEIPT_WIDTH);

  // Center a string in RECEIPT_WIDTH
  const center = (s: string) => {
    const pad = Math.max(0, Math.floor((RECEIPT_WIDTH - s.length) / 2));
    return ' '.repeat(pad) + s;
  };

  // Build item lines — two-line format like real thermal receipts
  const itemLines = data.items
    .map((item, i) => {
      const nameLabel = `${i + 1}. ${item.name}`;
      const qtyPriceLabel = `   ${item.quantity} x ${formatVND(item.unitPrice)}`;
      const totalLabel = formatVND(item.lineTotal);
      const spacer = RECEIPT_WIDTH - qtyPriceLabel.length - totalLabel.length;
      const line2 = qtyPriceLabel + (spacer > 0 ? ' '.repeat(spacer) : ' ') + totalLabel;
      return `<div>${escHtml(nameLabel)}</div><div>${escHtml(line2)}</div>`;
    })
    .join('');

  // Info rows helper
  const infoRow = (label: string, value: string) => {
    const spacer = RECEIPT_WIDTH - label.length - value.length;
    const line = label + (spacer > 0 ? ' '.repeat(spacer) : ' ') + value;
    return `<div>${escHtml(line)}</div>`;
  };

  const subtotalRow = infoRow('Tam tinh:', formatVND(data.subtotal));
  const discountRow =
    data.discountAmount > 0
      ? infoRow('Giam gia:', '-' + formatVND(data.discountAmount))
      : '';

  const totalLabel = 'TONG CONG:';
  const totalValue = formatVND(data.totalAmount);
  const totalSpacer = RECEIPT_WIDTH - totalLabel.length - totalValue.length;
  const totalLine =
    totalLabel + (totalSpacer > 0 ? ' '.repeat(totalSpacer) : ' ') + totalValue;

  const paymentLines = data.payments
    .map((p) => infoRow(paymentLabel(p.method) + ':', formatVND(p.amount)))
    .join('');
  const changeLine =
    data.changeAmount > 0 ? infoRow('Tien thua:', formatVND(data.changeAmount)) : '';

  const customerLines = [
    data.customerName ? infoRow('Khach hang:', data.customerName) : '',
    data.customerPhone ? infoRow('SDT:', data.customerPhone) : '',
  ]
    .filter(Boolean)
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>Hoa don ${escHtmlAttr(data.orderCode)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: 58mm;
      margin: 0 auto;
      padding: 6px 4px 12px;
      color: #000;
      background: #fff;
      line-height: 1.5;
      white-space: pre;
    }
    .store { font-size: 15px; font-weight: bold; text-align: center; letter-spacing: 1px; white-space: pre; }
    .subtitle { text-align: center; font-size: 11px; white-space: pre; }
    .dash { white-space: pre; }
    .items { white-space: pre; }
    .total-line { font-size: 14px; font-weight: bold; white-space: pre; }
    .footer { text-align: center; margin-top: 6px; white-space: pre; }
    @media print {
      body { width: 58mm; margin: 0; padding: 4px 4px 12px; }
    }
  </style>
</head>
<body>
<div class="store">${escHtml(storeName)}</div>
<div class="subtitle">HOA DON BAN HANG</div>
<div class="dash">${dash}</div>
${infoRow('Ma don:', data.orderCode)}
${infoRow('Ngay gio:', formatDateVN(data.createdAt))}
${customerLines}
<div class="dash">${dash}</div>
<div class="items">${itemLines}</div>
<div class="dash">${dash}</div>
${subtotalRow}
${discountRow}
<div class="dash">${dash}</div>
<div class="total-line">${escHtml(totalLine)}</div>
<div class="dash">${dash}</div>
${paymentLines}
${changeLine}
<div class="dash">${dash}</div>
<div class="footer">Cam on quy khach! Hen gap lai.</div>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escHtmlAttr(s: string): string {
  return escHtml(s).replace(/"/g, '&quot;');
}

interface ReceiptProps {
  data: ReceiptData;
  onNewOrder: () => void;
  onClose: () => void;
}

export default function Receipt({ data, onNewOrder, onClose }: ReceiptProps) {
  const storeName = data.storeName ?? 'GENHUB POS';

  const handlePrint = () => {
    const html = buildReceiptHTML(data);

    // Use hidden iframe to avoid popup blockers
    const existing = document.getElementById('receipt-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'receipt-print-frame';
    iframe.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();

    // Wait for resources then print
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        // Remove after a short delay to let the print dialog open
        setTimeout(() => {
          iframe.remove();
        }, 2000);
      }
    };
  };

  const DASH = '-'.repeat(32);

  // Helper: left/right row, total width 32 chars
  const Row = ({
    label,
    value,
    bold,
    red,
  }: {
    label: string;
    value: string;
    bold?: boolean;
    red?: boolean;
  }) => {
    const spacer = Math.max(1, 32 - label.length - value.length);
    return (
      <div
        className={`flex whitespace-pre ${bold ? 'font-bold' : ''} ${red ? 'text-red-600' : ''}`}
      >
        <span>{label}</span>
        <span>{' '.repeat(spacer)}</span>
        <span>{value}</span>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl w-full max-w-xs max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        {/* Receipt preview */}
        <div
          className="p-4 font-mono text-xs leading-relaxed"
          style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '12px' }}
        >
          {/* Header */}
          <div className="text-center font-bold text-sm tracking-wide">{storeName}</div>
          <div className="text-center text-[11px] text-gray-500">HOA DON BAN HANG</div>

          <div className="my-1.5 text-gray-400 whitespace-pre">{DASH}</div>

          {/* Order info */}
          <Row label="Ma don:" value={data.orderCode} />
          <Row label="Ngay gio:" value={formatDateVN(data.createdAt)} />
          {data.customerName && <Row label="Khach hang:" value={data.customerName} />}
          {data.customerPhone && <Row label="SDT:" value={data.customerPhone} />}

          <div className="my-1.5 text-gray-400 whitespace-pre">{DASH}</div>

          {/* Items */}
          {data.items.map((item, i) => {
            const qtyPrice = `   ${item.quantity} x ${formatVND(item.unitPrice)}`;
            const total = formatVND(item.lineTotal);
            const spacer = Math.max(1, 32 - qtyPrice.length - total.length);
            return (
              <div key={i}>
                <div className="whitespace-pre-wrap break-words">{`${i + 1}. ${item.name}`}</div>
                <div className="flex whitespace-pre">
                  <span>{qtyPrice}</span>
                  <span>{' '.repeat(spacer)}</span>
                  <span>{total}</span>
                </div>
              </div>
            );
          })}

          <div className="my-1.5 text-gray-400 whitespace-pre">{DASH}</div>

          {/* Totals */}
          <Row label="Tam tinh:" value={formatVND(data.subtotal)} />
          {data.discountAmount > 0 && (
            <Row label="Giam gia:" value={`-${formatVND(data.discountAmount)}`} red />
          )}

          <div className="my-1.5 text-gray-400 whitespace-pre">{DASH}</div>

          {/* Grand total */}
          <div className="font-bold text-sm whitespace-pre">
            {(() => {
              const label = 'TONG CONG:';
              const value = formatVND(data.totalAmount);
              const spacer = Math.max(1, 32 - label.length - value.length);
              return (
                <div className="flex">
                  <span>{label}</span>
                  <span>{' '.repeat(spacer)}</span>
                  <span>{value}</span>
                </div>
              );
            })()}
          </div>

          <div className="my-1.5 text-gray-400 whitespace-pre">{DASH}</div>

          {/* Payments */}
          {data.payments.map((p, i) => (
            <Row key={i} label={`${paymentLabel(p.method)}:`} value={formatVND(p.amount)} />
          ))}
          {data.changeAmount > 0 && (
            <Row label="Tien thua:" value={formatVND(data.changeAmount)} bold />
          )}

          <div className="my-1.5 text-gray-400 whitespace-pre">{DASH}</div>

          <div className="text-center text-[11px] text-gray-500">
            Cam on quy khach! Hen gap lai.
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 border border-[#FF6B35] text-[#FF6B35] rounded-xl font-medium hover:bg-orange-50 transition-colors text-sm"
          >
            In hoa don
          </button>
          <button
            onClick={onNewOrder}
            className="flex-1 py-2.5 bg-[#FF6B35] text-white rounded-xl font-medium hover:bg-[#E55A2B] transition-colors text-sm"
          >
            Don moi
          </button>
        </div>
      </div>
    </div>
  );
}
