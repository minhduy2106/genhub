'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, UserPlus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';
import { isOwner } from '@/lib/permissions';
import { formatDateTime } from '@/lib/utils/format';

interface StoreSettings {
  name: string;
  phone: string;
  address: string;
  settings: { lowStockAlert?: number; invoiceFooter?: string };
}

interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  role: string;
  permissions: string[];
  createdAt: string;
  lastLoginAt?: string | null;
}

interface StaffForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

const defaultStaffForm: StaffForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
};

const staffCapabilityLabels = [
  'Tạo hóa đơn bán hàng tại POS',
  'Xem và chỉnh sửa đơn hàng',
  'Xem tồn kho và điều chỉnh số lượng',
  'Xem sản phẩm nhưng không được sửa sản phẩm',
  'Không được xem báo cáo doanh thu',
];

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lowStockAlert, setLowStockAlert] = useState(5);
  const [invoiceFooter, setInvoiceFooter] = useState('Cảm ơn quý khách!');
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [staffForm, setStaffForm] = useState<StaffForm>(defaultStaffForm);
  const [loading, setLoading] = useState(true);
  const [savingStore, setSavingStore] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);

  const owner = isOwner(user);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [storeData, staffData] = await Promise.all([
        apiFetch<StoreSettings>('/auth/store'),
        apiFetch<StaffUser[]>('/auth/staff'),
      ]);

      setStoreName(storeData.name ?? '');
      setPhone(storeData.phone ?? '');
      setAddress(storeData.address ?? '');
      setLowStockAlert(storeData.settings?.lowStockAlert ?? 5);
      setInvoiceFooter(storeData.settings?.invoiceFooter ?? 'Cảm ơn quý khách!');
      setStaff(Array.isArray(staffData) ? staffData : []);
    } catch {
      setStoreName(user?.store?.name ?? '');
      toast.error('Không thể tải cài đặt cửa hàng hoặc danh sách nhân viên.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!owner) return;
    void loadSettings();
  }, [loadSettings, owner]);

  const handleSaveStore = async () => {
    setSavingStore(true);
    try {
      await apiFetch('/auth/store', {
        method: 'PATCH',
        body: JSON.stringify({
          name: storeName,
          phone,
          address,
          settings: { lowStockAlert, invoiceFooter },
        }),
      });
      toast.success('Đã lưu cài đặt thành công');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Không thể lưu cài đặt. Vui lòng thử lại.',
      );
    } finally {
      setSavingStore(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!staffForm.fullName.trim() || !staffForm.email.trim() || !staffForm.password.trim()) {
      toast.error('Vui lòng nhập họ tên, email và mật khẩu cho nhân viên');
      return;
    }

    setSavingStaff(true);
    try {
      const created = await apiFetch<StaffUser>('/auth/staff', {
        method: 'POST',
        body: JSON.stringify({
          fullName: staffForm.fullName.trim(),
          email: staffForm.email.trim(),
          phone: staffForm.phone.trim() || undefined,
          password: staffForm.password,
        }),
      });

      setStaff((prev) => [created, ...prev]);
      setStaffForm(defaultStaffForm);
      toast.success('Đã tạo tài khoản nhân viên');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Không thể tạo tài khoản nhân viên',
      );
    } finally {
      setSavingStaff(false);
    }
  };

  if (!owner) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-700">
        Chỉ chủ cửa hàng mới được phép vào trang cài đặt và tạo tài khoản nhân viên.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <div className="space-y-6">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Thông tin cửa hàng</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Tên cửa hàng
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Ngưỡng cảnh báo hết hàng
                </label>
                <input
                  type="number"
                  value={lowStockAlert}
                  onChange={(e) => setLowStockAlert(Number(e.target.value))}
                  className="w-full rounded-lg border px-4 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Footer hóa đơn
                </label>
                <textarea
                  value={invoiceFooter}
                  onChange={(e) => setInvoiceFooter(e.target.value)}
                  className="w-full rounded-lg border px-4 py-2"
                  rows={2}
                />
              </div>
              <button
                onClick={handleSaveStore}
                disabled={savingStore}
                className="flex items-center gap-2 rounded-lg bg-[#FF6B35] px-6 py-2 text-white hover:bg-[#E55A2B] disabled:opacity-60"
              >
                {savingStore && <Loader2 className="h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#FF6B35]" />
              <h3 className="font-semibold">Tạo tài khoản nhân viên</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Họ tên
                </label>
                <input
                  type="text"
                  value={staffForm.fullName}
                  onChange={(e) =>
                    setStaffForm((prev) => ({ ...prev, fullName: e.target.value }))
                  }
                  className="w-full rounded-lg border px-4 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Email đăng nhập
                </label>
                <input
                  type="email"
                  value={staffForm.email}
                  onChange={(e) =>
                    setStaffForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-lg border px-4 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  value={staffForm.phone}
                  onChange={(e) =>
                    setStaffForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full rounded-lg border px-4 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Mật khẩu tạm
                </label>
                <input
                  type="password"
                  value={staffForm.password}
                  onChange={(e) =>
                    setStaffForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full rounded-lg border px-4 py-2"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateStaff}
              disabled={savingStaff}
              className="mt-4 flex items-center gap-2 rounded-lg bg-[#1A202C] px-5 py-2 text-white hover:bg-[#111827] disabled:opacity-60"
            >
              {savingStaff && <Loader2 className="h-4 w-4 animate-spin" />}
              Tạo nhân viên
            </button>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold">Danh sách nhân viên</h3>
            {staff.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có nhân viên nào.</p>
            ) : (
              <div className="space-y-3">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{member.fullName}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-400">
                          {member.phone || 'Chưa có số điện thoại'}
                        </p>
                      </div>
                      <div className="text-right text-sm">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            member.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {member.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </span>
                        <p className="mt-2 text-xs text-gray-400">
                          Tạo: {formatDateTime(member.createdAt)}
                        </p>
                        <p className="text-xs text-gray-400">
                          Đăng nhập cuối:{' '}
                          {member.lastLoginAt
                            ? formatDateTime(member.lastLoginAt)
                            : 'Chưa đăng nhập'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-[#1A202C] p-6 text-white shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#FF6B35]" />
            <h3 className="font-semibold">Quyền của nhân viên</h3>
          </div>
          <div className="space-y-3 text-sm text-gray-200">
            {staffCapabilityLabels.map((label) => (
              <div key={label} className="rounded-lg bg-white/5 px-3 py-2">
                {label}
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Role nhân viên được tạo cố định để tránh cấp nhầm quyền xem doanh thu hoặc sửa hàng hóa.
          </p>
        </div>
      </div>
    </div>
  );
}
