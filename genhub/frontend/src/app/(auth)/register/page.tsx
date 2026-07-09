'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Loader2, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { API_URL } from '@/lib/api';
import { toast } from 'sonner';

type RegisterStep = 'details' | 'verify';

function getErrorMessage(json: unknown, fallback: string) {
  if (!json || typeof json !== 'object') return fallback;
  const payload = json as { message?: string | string[]; error?: { message?: string } };
  if (typeof payload.message === 'string') return payload.message;
  if (Array.isArray(payload.message)) return payload.message[0] ?? fallback;
  if (typeof payload.error?.message === 'string') return payload.error.message;
  return fallback;
}

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<RegisterStep>('details');
  const [storeName, setStoreName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateDetails = () => {
    const normalizedStoreName = storeName.trim();
    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim();

    if (normalizedStoreName.length < 2) {
      setError('Tên cửa hàng tối thiểu 2 ký tự');
      return false;
    }

    if (!normalizedFullName) {
      setError('Họ tên không được để trống');
      return false;
    }

    if (!normalizedEmail) {
      setError('Email không được để trống');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return false;
    }

    if (password.length < 6) {
      setError('Mật khẩu tối thiểu 6 ký tự');
      return false;
    }

    return true;
  };

  const buildRegisterBody = () => {
    const body: Record<string, string> = {
      storeName: storeName.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      verificationCode,
    };
    if (phone.trim()) {
      body.phone = phone.trim();
    }
    return body;
  };

  const sendVerificationCode = async () => {
    const res = await fetch(`${API_URL}/auth/register/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim() }),
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(getErrorMessage(json, 'Không gửi được mã xác nhận'));
    }

    const data = json.data ?? json;
    toast.success(data.message || 'Mã xác nhận đã được gửi');
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateDetails()) return;

    setLoading(true);
    try {
      await sendVerificationCode();
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi mã xác nhận');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);
    try {
      await sendVerificationCode();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi lại mã xác nhận');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateDetails()) return;

    if (!/^\d{6}$/.test(verificationCode)) {
      setError('Vui lòng nhập mã xác nhận 6 chữ số');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRegisterBody()),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(getErrorMessage(json, 'Đăng ký thất bại'));
        return;
      }

      const data = json.data ?? json;
      setAuth(data.user, data.accessToken);
      localStorage.setItem('accessToken', data.accessToken);
      toast.success('Đăng ký thành công!');
      router.push('/dashboard');
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
          <h1 className="text-xl font-bold">Đăng ký tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">
            {step === 'details' ? 'Tạo cửa hàng của bạn miễn phí' : `Nhập mã đã gửi đến ${email.trim()}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên cửa hàng</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                minLength={2}
                placeholder="VD: Cửa hàng ABC"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại <span className="text-gray-400 font-normal">(không bắt buộc)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF9046] text-white shadow-md shadow-orange-500/25 rounded-lg font-semibold hover:from-[#F0561D] hover:to-[#FF813A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Đang gửi mã...' : 'Gửi mã xác nhận email'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2.5 border rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã xác nhận (6 chữ số)</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#FF6B35]/50 focus:outline-none text-center text-lg tracking-widest"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF9046] text-white shadow-md shadow-orange-500/25 rounded-lg font-semibold hover:from-[#F0561D] hover:to-[#FF813A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Đang đăng ký...' : 'Xác nhận và tạo tài khoản'}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { setStep('details'); setError(''); }}
                disabled={loading}
                className="py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Sửa thông tin
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="py-2 text-sm text-[#FF6B35] hover:underline disabled:opacity-50"
              >
                Gửi lại mã
              </button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Đã có tài khoản?{' '}
          <Link href="/login" className="text-[#FF6B35] hover:underline font-medium">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
