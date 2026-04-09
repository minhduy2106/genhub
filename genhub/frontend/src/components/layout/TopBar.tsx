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
    <header className="h-14 border-b bg-white flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative max-w-md w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 hover:bg-gray-100 rounded-lg">
          <Bell className="h-5 w-5 text-gray-600" />
        </button>
        <div className="relative pl-3 border-l" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:bg-gray-50 rounded-lg p-1 transition-colors"
          >
            <div className="h-8 w-8 bg-[#FF6B35] rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-gray-500">{displayRole}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push('/profile');
                }}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <User className="h-4 w-4 text-gray-500" />
                Tài khoản
              </button>
              <div className="border-t my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
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
