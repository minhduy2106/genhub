'use client';

import { useState } from 'react';
import { X, Banknote, CreditCard, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

type PaymentMethod = 'cash' | 'card' | 'bank_transfer';

interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
}

interface PaymentModalProps {
  totalAmount: number;
  onConfirm: (payments: PaymentEntry[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const METHOD_OPTIONS: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { key: 'cash', label: 'Tiền mặt', icon: Banknote },
  { key: 'card', label: 'Thẻ', icon: CreditCard },
  { key: 'bank_transfer', label: 'Chuyển khoản', icon: Building2 },
];

export default function PaymentModal({ totalAmount, onConfirm, onCancel, isLoading }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState<string>(totalAmount.toString());
  const [splitMode, setSplitMode] = useState(false);
  const [splitPayments, setSplitPayments] = useState<PaymentEntry[]>([]);
  const [splitMethod, setSplitMethod] = useState<PaymentMethod>('cash');
  const [splitAmount, setSplitAmount] = useState<string>('');

  const cashReceivedNum = Number(cashReceived) || 0;
  const changeAmount = selectedMethod === 'cash' ? Math.max(0, cashReceivedNum - totalAmount) : 0;
  const isValid = selectedMethod === 'cash' ? cashReceivedNum >= totalAmount : true;

  // Split payment helpers
  const splitPaid = splitPayments.reduce((s, p) => s + p.amount, 0);
  const splitRemaining = totalAmount - splitPaid;

  const addSplitPayment = () => {
    const amount = Number(splitAmount) || 0;
    if (amount <= 0) return;
    setSplitPayments([...splitPayments, { method: splitMethod, amount }]);
    setSplitAmount('');
  };

  const removeSplitPayment = (index: number) => {
    setSplitPayments(splitPayments.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (splitMode) {
      if (splitPaid < totalAmount) return;
      onConfirm(splitPayments);
    } else {
      const amount = selectedMethod === 'cash' ? cashReceivedNum : totalAmount;
      onConfirm([{ method: selectedMethod, amount }]);
    }
  };

  const quickCashAmounts = [totalAmount, ...([50000, 100000, 200000, 500000].filter((v) => v > totalAmount))];
  // Deduplicate
  const uniqueQuickAmounts = [...new Set(quickCashAmounts)];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold">Thanh toán</h2>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Total */}
          <div className="text-center py-3 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">Tổng tiền</p>
            <p className="text-3xl font-bold text-[#FF6B35]">{formatCurrency(totalAmount)}</p>
          </div>

          {/* Split mode toggle */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={splitMode}
              onChange={(e) => {
                setSplitMode(e.target.checked);
                setSplitPayments([]);
              }}
              className="rounded accent-[#FF6B35]"
            />
            Thanh toán nhiều phương thức
          </label>

          {!splitMode ? (
            <>
              {/* Payment method selection */}
              <div className="grid grid-cols-3 gap-2">
                {METHOD_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setSelectedMethod(opt.key)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                        selectedMethod === opt.key
                          ? 'border-[#FF6B35] bg-orange-50 text-[#FF6B35]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-xs font-medium">{opt.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Cash-specific UI */}
              {selectedMethod === 'cash' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Tiền khách đưa</label>
                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl text-lg font-medium focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
                      min={0}
                    />
                  </div>
                  {/* Quick amounts */}
                  <div className="flex flex-wrap gap-2">
                    {uniqueQuickAmounts.map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCashReceived(amount.toString())}
                        className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
                      >
                        {formatCurrency(amount)}
                      </button>
                    ))}
                  </div>
                  {/* Change */}
                  <div className="flex justify-between p-3 bg-green-50 rounded-xl">
                    <span className="text-sm text-gray-600">Tiền thừa</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(changeAmount)}</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Split payment mode */
            <div className="space-y-3">
              {/* List added payments */}
              {splitPayments.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm">
                    {METHOD_OPTIONS.find((o) => o.key === p.method)?.label}: {formatCurrency(p.amount)}
                  </span>
                  <button onClick={() => removeSplitPayment(i)} className="text-red-500 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Remaining */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Còn lại:</span>
                <span className={`font-medium ${splitRemaining > 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {formatCurrency(Math.max(0, splitRemaining))}
                </span>
              </div>

              {/* Add split payment */}
              {splitRemaining > 0 && (
                <div className="flex gap-2">
                  <select
                    value={splitMethod}
                    onChange={(e) => setSplitMethod(e.target.value as PaymentMethod)}
                    className="border rounded-lg px-2 py-2 text-sm"
                  >
                    {METHOD_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Số tiền"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
                    min={0}
                  />
                  <button
                    onClick={addSplitPayment}
                    className="px-3 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-medium hover:bg-[#E55A2B]"
                  >
                    Thêm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || (!splitMode && !isValid) || (splitMode && splitPaid < totalAmount)}
            className="flex-1 py-3 bg-[#FF6B35] text-white rounded-xl font-bold hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </button>
        </div>
      </div>
    </div>
  );
}
