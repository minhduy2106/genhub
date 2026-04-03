'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Loader2, X, UserPlus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';

/* ---------- Types ---------- */
interface Customer {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  totalSpent: number;
  totalOrders: number;
  lastOrderAt?: string | null;
}

interface PaginatedResponse {
  data: Customer[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/* ---------- Add Customer Modal ---------- */
interface AddCustomerModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function AddCustomerModal({ onClose, onCreated }: AddCustomerModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      toast.error('Vui lòng nhập họ tên và số điện thoại');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim() || undefined,
        }),
      });
      toast.success('Đã thêm khách hàng thành công');
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể thêm khách hàng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-lg">Thêm khách hàng mới</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ tên khách hàng"
              className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
              className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email (tùy chọn)"
              className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ (tùy chọn)"
              className="w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#FF6B35] text-white rounded-lg text-sm font-medium hover:bg-[#E55A2B] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Thêm khách hàng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchCustomers = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const query = q ? `&search=${encodeURIComponent(q)}` : '';
      const res = await apiFetch<PaginatedResponse | Customer[]>(
        `/customers?page=1&limit=50${query}`,
      );
      if (Array.isArray(res)) {
        setCustomers(res);
      } else if (res && typeof res === 'object' && 'data' in res) {
        setCustomers(res.data);
      } else {
        setCustomers([]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể tải danh sách khách hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  /* Initial load */
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  /* Debounced search */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(search.trim() || undefined);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, fetchCustomers]);

  const handleCreated = () => {
    setShowAddModal(false);
    fetchCustomers(search.trim() || undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Khách hàng</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#FF6B35] text-white px-4 py-2 rounded-lg hover:bg-[#E55A2B] transition-colors"
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
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {search ? `Không tìm thấy khách hàng với từ khóa "${search}"` : 'Chưa có khách hàng nào'}
          </div>
        ) : (
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
              {customers.map((customer) => (
                <tr key={customer.id} className="border-t hover:bg-gray-50 cursor-pointer">
                  <td className="p-4 font-medium">{customer.fullName}</td>
                  <td className="p-4 text-gray-500">{customer.phone ?? '-'}</td>
                  <td className="p-4 text-gray-500 hidden md:table-cell">
                    {customer.email ?? '-'}
                  </td>
                  <td className="p-4 text-right font-medium">
                    {formatCurrency(Number(customer.totalSpent))}
                  </td>
                  <td className="p-4 text-right hidden sm:table-cell">{customer.totalOrders}</td>
                  <td className="p-4 text-gray-500 hidden lg:table-cell">
                    {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <AddCustomerModal onClose={() => setShowAddModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}
