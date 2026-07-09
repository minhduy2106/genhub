'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message || 'Có lỗi xảy ra');
        return;
      }

      const data = json.data ?? json;
      toast.success(data.message || 'Mã xác nhận đã được gửi');
      setStep(2);
    } catch {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message || 'Có lỗi xảy ra');
        return;
      }

      toast.success('Đặt lại mật khẩu thành công!');
      router.push('/login');
    } catch {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFF4EE] via-[#F7F8FA] to-[#FFE8DB] p-4">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#FF6B35]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#FF9046]/20 blur-3xl" />
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl shadow-orange-500/10 border border-white p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF9046] shadow-lg shadow-orange-500/30">
            <Store className="h-7 w-7 text-white" />
          </div>
          <span className="block text-2xl font-bold bg-gradient-to-r from-[#FF6B35] to-[#FF9046] bg-clip-text text-transparent">TinHub</span>
          <h1 className="text-xl font-bold">Quên mật khẩu</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1
              ? 'Nhập email để nhận mã xác nhận'
              : 'Nhập mã xác nhận và mật khẩu mới'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF9046] text-white shadow-md shadow-orange-500/25 rounded-lg font-semibold hover:from-[#F0561D] hover:to-[#FF813A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã xác nhận (6 chữ số)</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none text-center text-lg tracking-widest"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF9046] text-white shadow-md shadow-orange-500/25 rounded-lg font-semibold hover:from-[#F0561D] hover:to-[#FF813A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setError(''); }}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Gửi lại mã xác nhận
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-[#FF6B35] hover:underline font-medium">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
