'use client';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('Cửa hàng Thời Trang Lan');
  const [phone, setPhone] = useState('0901234567');
  const [address, setAddress] = useState('123 Nguyễn Huệ, Quận 1, TP.HCM');
  const [lowStockAlert, setLowStockAlert] = useState(5);
  const [invoiceFooter, setInvoiceFooter] = useState('Cảm ơn quý khách!');

  const handleSave = () => {
    toast.success('Đã lưu cài đặt thành công!');
  };

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
          <button onClick={handleSave} className="bg-[#FF6B35] text-white px-6 py-2 rounded-lg hover:bg-[#E55A2B]">
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
