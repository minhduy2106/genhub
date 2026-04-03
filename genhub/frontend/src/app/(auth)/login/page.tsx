'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState('lan@genhub.vn');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.message || 'Đăng nhập thất bại');
        return;
      }

      const data = json.data ?? json;
      setAuth(data.user, data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=${15 * 60}; SameSite=Lax`;
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      toast.success('Đăng nhập thành công!');
      router.push('/dashboard');
    } catch {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Store className="h-8 w-8 text-[#FF6B35]" />
            <span className="text-2xl font-bold text-[#FF6B35]">GenHub</span>
          </div>
          <h1 className="text-xl font-bold">Đăng nhập</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý cửa hàng của bạn</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
              <Link href="/forgot-password" className="text-xs text-[#FF6B35] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#FF6B35] text-white rounded-lg font-semibold hover:bg-[#E55A2B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-[#FF6B35] hover:underline font-medium">
            Đăng ký ngay
          </Link>
        </p>

        <p className="text-center text-xs text-gray-400 mt-3">
          Demo: lan@genhub.vn / 123456
        </p>
      </div>
    </div>
  );
}
