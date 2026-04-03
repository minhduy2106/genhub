'use client';

import { formatCurrency, formatDateTime } from '@/lib/utils/format';
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

interface ReceiptProps {
  data: ReceiptData;
  onNewOrder: () => void;
  onClose: () => void;
}

export default function Receipt({ data, onNewOrder, onClose }: ReceiptProps) {
  const user = useAuthStore((s) => s.user);

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-specific CSS: hide everything on page except the receipt content */}
      <style>{`
        @media print {
          /* Hide the entire body first */
          body * {
            visibility: hidden !important;
          }
          /* Then show only the receipt and its children */
          #receipt-print-root,
          #receipt-print-root * {
            visibility: visible !important;
          }
          /* Position the receipt at the top-left of the page */
          #receipt-print-root {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 80mm !important;
            background: white !important;
            z-index: 99999 !important;
            padding: 8px !important;
          }
          /* Hide action buttons from print */
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
        >
          {/* Receipt content - this element is targeted by print CSS */}
          <div id="receipt-print-root">
            <div className="p-6 text-center text-sm font-mono">
              {/* Store info */}
              <h2 className="text-lg font-bold tracking-wide">{user?.store?.name ?? 'GENHUB POS'}</h2>

              <div className="border-t border-dashed my-3" />

              {/* Order info */}
              <div className="text-xs space-y-1 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-500">Mã đơn:</span>
                  <span className="font-semibold">{data.orderCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ngày:</span>
                  <span>{formatDateTime(data.createdAt)}</span>
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
                    <th className="text-left py-1 font-semibold">Sản phẩm</th>
                    <th className="text-center py-1 font-semibold w-8">SL</th>
                    <th className="text-right py-1 font-semibold">Đơn giá</th>
                    <th className="text-right py-1 font-semibold">T.Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, i) => (
                    <tr key={i} className="border-b border-dotted border-gray-200">
                      <td className="text-left py-1 pr-1" style={{ maxWidth: '110px', wordBreak: 'break-word' }}>
                        {item.name}
                        {item.sku && <span className="block text-gray-400 text-[10px]">{item.sku}</span>}
                      </td>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-right py-1 whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right py-1 whitespace-nowrap">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed my-3" />

              {/* Totals */}
              <div className="space-y-1 text-xs text-left">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tạm tính:</span>
                  <span>{formatCurrency(data.subtotal)}</span>
                </div>
                {data.discountAmount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Giảm giá:</span>
                    <span>-{formatCurrency(data.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t border-gray-300 pt-1.5 mt-1">
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(data.totalAmount)}</span>
                </div>
              </div>

              <div className="border-t border-dashed my-3" />

              {/* Payments */}
              <div className="space-y-1 text-xs text-left">
                {data.payments.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span className="text-gray-500">{paymentLabel(p.method)}:</span>
                    <span className="font-medium">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
                {data.changeAmount > 0 && (
                  <div className="flex justify-between font-semibold">
                    <span>Tiền thừa:</span>
                    <span>{formatCurrency(data.changeAmount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed my-3" />

              <p className="text-xs text-gray-400 text-center">
                Cảm ơn quý khách! Hẹn gặp lại.
              </p>
            </div>
          </div>

          {/* Action buttons — hidden during print */}
          <div className="p-4 border-t flex gap-2 no-print">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 border border-[#FF6B35] text-[#FF6B35] rounded-xl font-medium hover:bg-orange-50 transition-colors text-sm"
            >
              In / Lưu PDF
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
    </>
  );
}
