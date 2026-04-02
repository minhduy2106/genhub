'use client';
import { useState } from 'react';
import { mockOrders } from '@/lib/mock-data';
import { formatCurrency, formatDateTime } from '@/lib/utils/format';
import { StatusBadge } from '@/components/common/StatusBadge';

const statusTabs = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xử lý' },
  { key: 'completed', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã hủy' },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all');

  const filtered = activeTab === 'all'
    ? mockOrders
    : mockOrders.filter((o) => o.status === activeTab);

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
              {filtered.map((order) => (
                <tr key={order.id} className="border-t hover:bg-gray-50 cursor-pointer">
                  <td className="p-4 font-medium text-[#FF6B35]">{order.code}</td>
                  <td className="p-4">{order.customerName}</td>
                  <td className="p-4 text-gray-500 hidden sm:table-cell uppercase text-xs">{order.channel}</td>
                  <td className="p-4 text-right font-medium">{formatCurrency(order.totalAmount)}</td>
                  <td className="p-4"><StatusBadge status={order.status} /></td>
                  <td className="p-4 text-gray-500 hidden md:table-cell">{formatDateTime(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
