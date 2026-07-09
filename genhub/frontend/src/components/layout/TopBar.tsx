'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';

const roleLabels: Record<string, string> = {
  owner: 'Chủ cửa hàng',
  staff: 'Nhân viên bán hàng',
  OWNER: 'Chủ cửa hàng',
  MANAGER: 'Quản lý',
  CASHIER: 'Thu ngân',
  STAFF: 'Nhân viên',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function TopBar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const displayName = user?.fullName || 'Người dùng';
  const displayRole = user?.role ? (roleLabels[user.role] || user.role) : 'Nhân viên';

  return (
    <header className="relative z-[80] h-14 shrink-0 overflow-visible border-b border-gray-200/80 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100/80 border border-transparent rounded-xl transition-all focus:outline-none focus:bg-white focus:border-[#FF6B35]/40 focus:ring-2 focus:ring-[#FF6B35]/20"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#FF6B35] ring-2 ring-white" />
        </button>
        <div className="relative z-[90] pl-3 border-l border-gray-200" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative z-[91] flex items-center gap-2 hover:bg-gray-50 rounded-xl p-1 transition-colors"
          >
            <div className="h-8 w-8 bg-gradient-to-br from-[#FF6B35] to-[#FF9046] rounded-full flex items-center justify-center shadow-md shadow-orange-500/25 text-xs font-bold text-white">
              {initials(displayName)}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-gray-500">{displayRole}</p>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 hidden sm:block transition-transform ${
                dropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-[100] mt-2 w-52 rounded-xl border border-gray-100 bg-white py-1.5 shadow-xl shadow-gray-900/10">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-gray-500">{displayRole}</p>
              </div>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push('/profile');
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <User className="h-4 w-4 text-gray-500" />
                Tài khoản
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
