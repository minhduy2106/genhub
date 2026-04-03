'use client';
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { mockCustomers } from '@/lib/mock-data';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const filtered = mockCustomers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Khách hàng</h1>
        <button
          onClick={() => toast.info('Tính năng thêm khách hàng đang phát triển')}
          className="flex items-center gap-2 bg-[#FF6B35] text-white px-4 py-2 rounded-lg hover:bg-[#E55A2B]"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Thêm khách hàng</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm theo tên, SĐT..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="p-4 font-medium">Tên khách hàng</th>
              <th className="p-4 font-medium">SĐT</th>
              <th className="p-4 font-medium hidden md:table-cell">Email</th>
              <th className="p-4 font-medium text-right">Tổng mua</th>
              <th className="p-4 font-medium text-right hidden sm:table-cell">Số đơn</th>
              <th className="p-4 font-medium hidden lg:table-cell">Lần mua cuối</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.id} className="border-t hover:bg-gray-50 cursor-pointer">
                <td className="p-4 font-medium">{customer.fullName}</td>
                <td className="p-4 text-gray-500">{customer.phone}</td>
                <td className="p-4 text-gray-500 hidden md:table-cell">{customer.email ?? '-'}</td>
                <td className="p-4 text-right font-medium">{formatCurrency(customer.totalSpent)}</td>
                <td className="p-4 text-right hidden sm:table-cell">{customer.totalOrders}</td>
                <td className="p-4 text-gray-500 hidden lg:table-cell">{formatDate(customer.lastOrderAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
