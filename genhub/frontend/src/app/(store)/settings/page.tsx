'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth.store';

interface StoreSettings {
  name: string;
  phone: string;
  address: string;
  settings: { lowStockAlert?: number; invoiceFooter?: string };
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [storeName, setStoreName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lowStockAlert, setLowStockAlert] = useState(5);
  const [invoiceFooter, setInvoiceFooter] = useState('Cảm ơn quý khách!');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<StoreSettings>('/auth/store')
      .then((data) => {
        setStoreName(data.name ?? '');
        setPhone(data.phone ?? '');
        setAddress(data.address ?? '');
        setLowStockAlert(data.settings?.lowStockAlert ?? 5);
        setInvoiceFooter(data.settings?.invoiceFooter ?? 'Cảm ơn quý khách!');
      })
      .catch(() => {
        // Fall back to auth store data for name
        setStoreName(user?.store?.name ?? '');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
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
      toast.success('Đã lưu cài đặt thành công!');
    } catch {
      toast.error('Không thể lưu cài đặt. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm max-w-2xl">
        <h3 className="font-semibold mb-4">Thông tin cửa hàng</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên cửa hàng</label>
            <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngưỡng cảnh báo hết hàng</label>
            <input type="number" value={lowStockAlert} onChange={(e) => setLowStockAlert(Number(e.target.value))} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Footer hóa đơn</label>
            <textarea value={invoiceFooter} onChange={(e) => setInvoiceFooter(e.target.value)} className="w-full px-4 py-2 border rounded-lg" rows={2} />
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-[#FF6B35] text-white px-6 py-2 rounded-lg hover:bg-[#E55A2B] disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
