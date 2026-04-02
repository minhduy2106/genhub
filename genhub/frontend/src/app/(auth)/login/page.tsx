'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/dashboard');
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              defaultValue="lan@genhub.vn"
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              defaultValue="123456"
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-[#FF6B35] text-white rounded-lg font-semibold hover:bg-[#E55A2B] transition-colors"
          >
            Đăng nhập
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Chưa có tài khoản?{' '}
          <Link href="/register" className="text-[#FF6B35] font-medium hover:underline">
            Tạo tài khoản
          </Link>
        </p>
      </div>
    </div>
  );
}
