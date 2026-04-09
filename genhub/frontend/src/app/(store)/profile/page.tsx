'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { User, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { apiFetch } from '@/lib/api';

const roleLabels: Record<string, string> = {
  owner: 'Chủ cửa hàng',
  staff: 'Nhân viên bán hàng',
  OWNER: 'Chủ cửa hàng',
  MANAGER: 'Quản lý',
  CASHIER: 'Thu ngân',
  STAFF: 'Nhân viên',
};

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }
    setLoading(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Đổi mật khẩu thất bại!';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tài khoản</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 bg-[#FF6B35] rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">{user?.fullName || 'Người dùng'}</h2>
            <p className="text-sm text-gray-500">
              {user?.role ? (roleLabels[user.role] || user.role) : ''}
            </p>
          </div>
        </div>

        <h3 className="font-semibold mb-4">Thông tin cá nhân</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-24">Họ tên:</span>
            <span className="text-sm font-medium">{user?.fullName || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-24">Email:</span>
            <span className="text-sm font-medium">{user?.email || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-24">Điện thoại:</span>
            <span className="text-sm font-medium">{user?.phone || '-'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-24">Vai trò:</span>
            <span className="text-sm font-medium">
              {user?.role ? (roleLabels[user.role] || user.role) : '-'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-24">Cửa hàng:</span>
            <span className="text-sm font-medium">{user?.store?.name || '-'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm max-w-2xl">
        <h3 className="font-semibold mb-4">Đổi mật khẩu</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#FF6B35] text-white px-6 py-2 rounded-lg hover:bg-[#E55A2B] disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Đổi mật khẩu
          </button>
        </form>
      </div>
    </div>
  );
}
