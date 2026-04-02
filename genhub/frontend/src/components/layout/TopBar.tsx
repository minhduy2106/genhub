'use client';
import { Bell, Search, User } from 'lucide-react';

export function TopBar() {
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
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>
        <div className="flex items-center gap-2 pl-3 border-l">
          <div className="h-8 w-8 bg-[#FF6B35] rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium">Nguyễn Thị Lan</p>
            <p className="text-xs text-gray-500">Chủ cửa hàng</p>
          </div>
        </div>
      </div>
    </header>
  );
}
