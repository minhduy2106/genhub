'use client';

import { formatCurrency, formatDateTime } from '@/lib/utils/format';

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
}

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Tien mat',
  card: 'The',
  bank_transfer: 'Chuyen khoan',
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
  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-specific CSS */}
      <style>{`
        @media print {
          body > *:not(#receipt-print-root) { display: none !important; }
          #receipt-print-root {
            position: fixed;
            inset: 0;
            z-index: 99999;
            background: white;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 no-print" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div id="receipt-print-root">
            <div className="p-6 text-center text-sm">
              {/* Store info */}
              <h2 className="text-lg font-bold">GenHub POS</h2>
              <p className="text-gray-500 text-xs">123 Nguyen Hue, Quan 1, TP.HCM</p>
              <p className="text-gray-500 text-xs">SĐT: 0900 000 000</p>

              <div className="border-t border-dashed my-3" />

              {/* Order info */}
              <div className="flex justify-between text-xs">
                <span>Ma don:</span>
                <span className="font-medium">{data.orderCode}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Ngay:</span>
                <span>{formatDateTime(data.createdAt)}</span>
              </div>
              {data.customerName && (
                <div className="flex justify-between text-xs">
                  <span>Khach hang:</span>
                  <span>{data.customerName}</span>
                </div>
              )}

              <div className="border-t border-dashed my-3" />

              {/* Items */}
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">San pham</th>
                    <th className="text-center py-1">SL</th>
                    <th className="text-right py-1">Don gia</th>
                    <th className="text-right py-1">T.Tien</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, i) => (
                    <tr key={i} className="border-b border-dotted">
                      <td className="text-left py-1 max-w-[120px] truncate">{item.name}</td>
                      <td className="text-center py-1">{item.quantity}</td>
                      <td className="text-right py-1">{formatCurrency(item.unitPrice)}</td>
                      <td className="text-right py-1">{formatCurrency(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed my-3" />

              {/* Totals */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Tam tinh:</span>
                  <span>{formatCurrency(data.subtotal)}</span>
                </div>
                {data.discountAmount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Giam gia:</span>
                    <span>-{formatCurrency(data.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Tong cong:</span>
                  <span>{formatCurrency(data.totalAmount)}</span>
                </div>
              </div>

              <div className="border-t border-dashed my-3" />

              {/* Payments */}
              <div className="space-y-1 text-xs">
                {data.payments.map((p, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{paymentLabel(p.method)}:</span>
                    <span>{formatCurrency(p.amount)}</span>
                  </div>
                ))}
                {data.changeAmount > 0 && (
                  <div className="flex justify-between font-medium">
                    <span>Tien thua:</span>
                    <span>{formatCurrency(data.changeAmount)}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed my-3" />
              <p className="text-xs text-gray-400">Cam on quy khach!</p>
            </div>
          </div>

          {/* Action buttons - hidden on print */}
          <div className="p-4 border-t flex gap-3 no-print">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 border border-[#FF6B35] text-[#FF6B35] rounded-xl font-medium hover:bg-orange-50 transition-colors"
            >
              In hoa don
            </button>
            <button
              onClick={onNewOrder}
              className="flex-1 py-2.5 bg-[#FF6B35] text-white rounded-xl font-medium hover:bg-[#E55A2B] transition-colors"
            >
              Don moi
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
