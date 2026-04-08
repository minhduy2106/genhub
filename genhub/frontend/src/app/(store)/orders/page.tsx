'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { StatusBadge } from '@/components/common/StatusBadge';
import { PAYMENT_METHODS } from '@/lib/utils/constants';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

const statusTabs = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
];

interface OrderItem {
  id: string;
  productSnapshot: { name: string; sku?: string };
  quantity: number;
  unitPrice: number | string;
  discountAmount: number | string;
  lineTotal: number | string;
}

interface Payment {
  id: string;
  method: string;
  amount: number | string;
  status: string;
}

interface Customer {
  id: string;
  fullName: string;
  phone?: string;
}

interface Order {
  id: string;
  code: string;
  status: string;
  channel: string;
  subtotal: number | string;
  discountAmount: number | string;
  totalAmount: number | string;
  paidAmount: number | string;
  createdAt: string;
  customerNote?: string | null;
  internalNote?: string | null;
  customer?: Customer;
  items: OrderItem[];
  payments: Payment[];
}

interface PaginatedOrders {
  data: Order[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [customerNote, setCustomerNote] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (activeTab !== 'all') params.set('status', activeTab);
      const res = await apiFetch<PaginatedOrders>(`/orders?${params.toString()}`);
      setOrders(res.data ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleComplete = async (order: Order) => {
    setActionLoading(true);
    try {
      await apiFetch(`/orders/${order.id}/complete`, { method: 'PATCH' });
      toast.success('Đơn hàng đã được xác nhận hoàn thành');
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể xác nhận đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (order: Order) => {
    if (!showCancelInput) {
      setShowCancelInput(true);
      return;
    }
    // completed orders require a non-empty reason
    if (order.status === 'completed' && !cancelReason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn hàng đã hoàn thành');
      return;
    }
    setActionLoading(true);
    try {
      await apiFetch(`/orders/${order.id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason: cancelReason.trim() || 'Hủy đơn' }),
      });
      toast.success('Đơn hàng đã được hủy');
      setSelectedOrder(null);
      setShowCancelInput(false);
      setCancelReason('');
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể hủy đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowCancelInput(false);
    setCancelReason('');
    setCustomerNote(order.customerNote ?? '');
    setInternalNote(order.internalNote ?? '');
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setShowCancelInput(false);
    setCancelReason('');
    setCustomerNote('');
    setInternalNote('');
  };

  const handleSaveOrder = async () => {
    if (!selectedOrder) return;

    setActionLoading(true);
    try {
      const updated = await apiFetch<Order>(`/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customerNote,
          internalNote,
        }),
      });
      setSelectedOrder(updated);
      toast.success('Đã cập nhật đơn hàng');
      fetchOrders();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể cập nhật đơn hàng');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Đơn hàng</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-[#FF6B35] text-white'
                : 'bg-white text-gray-600 border hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Đang tải...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            Không có đơn hàng nào
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-500">
                  <th className="p-4 font-medium">Mã đơn</th>
                  <th className="p-4 font-medium">Khách hàng</th>
                  <th className="p-4 font-medium hidden sm:table-cell">Kênh</th>
                  <th className="p-4 font-medium text-right">Tổng tiền</th>
                  <th className="p-4 font-medium">Trạng thái</th>
                  <th className="p-4 font-medium hidden md:table-cell">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => openOrder(order)}
                    className="border-t hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="p-4 font-medium text-[#FF6B35]">{order.code}</td>
                    <td className="p-4">
                      {order.customer ? (
                        <div>
                          <div className="font-medium">{order.customer.fullName}</div>
                          {order.customer.phone && (
                            <div className="text-xs text-gray-400">{order.customer.phone}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">Khách lẻ</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500 hidden sm:table-cell uppercase text-xs">{order.channel}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(order.totalAmount)}</td>
                    <td className="p-4"><StatusBadge status={order.status} /></td>
                    <td className="p-4 text-gray-500 hidden md:table-cell">{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-[#FF6B35]">{selectedOrder.code}</h2>
                <div className="mt-0.5">
                  <StatusBadge status={selectedOrder.status} />
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Khách hàng</h3>
                {selectedOrder.customer ? (
                  <div className="text-sm">
                    <div className="font-medium">{selectedOrder.customer.fullName}</div>
                    {selectedOrder.customer.phone && (
                      <div className="text-gray-500">{selectedOrder.customer.phone}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">Khách lẻ</div>
                )}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Sản phẩm</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="flex-1 pr-4">
                        <div className="font-medium">{item.productSnapshot?.name}</div>
                        {item.productSnapshot?.sku && (
                          <div className="text-xs text-gray-400">SKU: {item.productSnapshot.sku}</div>
                        )}
                        <div className="text-xs text-gray-500">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                          {Number(item.discountAmount) > 0 && (
                            <span className="text-red-500"> - {formatCurrency(item.discountAmount)}</span>
                          )}
                        </div>
                      </div>
                      <div className="font-medium whitespace-nowrap">{formatCurrency(item.lineTotal)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {Number(selectedOrder.discountAmount) > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Tổng cộng</span>
                  <span className="text-[#FF6B35]">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              {/* Payments */}
              {selectedOrder.payments.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Thanh toán</h3>
                  <div className="space-y-1">
                    {selectedOrder.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          {PAYMENT_METHODS[payment.method as keyof typeof PAYMENT_METHODS] ?? payment.method}
                        </span>
                        <span className="font-medium">{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date */}
              <div className="text-xs text-gray-400">
                Tạo lúc: {formatDateTime(selectedOrder.createdAt)}
              </div>

              <div className="grid gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú khách hàng</label>
                  <textarea
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
                    placeholder="Ví dụ: giao nhanh, gọi trước khi giao..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú nội bộ</label>
                  <textarea
                    value={internalNote}
                    onChange={(e) => setInternalNote(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
                    placeholder="Ghi chú xử lý đơn hàng..."
                  />
                </div>
                <button
                  onClick={handleSaveOrder}
                  disabled={actionLoading}
                  className="py-2.5 bg-gray-900 text-white rounded-lg text-sm font-semibold hover:bg-black transition-colors disabled:opacity-50"
                >
                  Lưu chỉnh sửa đơn hàng
                </button>
              </div>

              {/* Cancel reason input */}
              {showCancelInput && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lý do hủy đơn{' '}
                    {selectedOrder.status === 'completed' ? (
                      <span className="text-red-500 font-normal">(bắt buộc)</span>
                    ) : (
                      <span className="text-gray-400 font-normal">(không bắt buộc)</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder={
                      selectedOrder.status === 'completed'
                        ? 'Nhập lý do hủy (bắt buộc)...'
                        : 'Nhập lý do hủy...'
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
                  />
                </div>
              )}

              {/* Action Buttons */}
              {selectedOrder.status !== 'cancelled' && (
                <div className="flex gap-2 pt-1">
                  {selectedOrder.status === 'pending' && (
                    <button
                      onClick={() => handleComplete(selectedOrder)}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 bg-[#FF6B35] text-white rounded-lg text-sm font-semibold hover:bg-[#E55A2B] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Xác nhận
                    </button>
                  )}
                  <button
                    onClick={() => handleCancel(selectedOrder)}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {showCancelInput ? 'Xác nhận hủy' : 'Hủy đơn'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
