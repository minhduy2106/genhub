'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList,
  Warehouse, Users, BarChart3, Truck, UserCog, Settings, ChevronLeft, Store,
} from 'lucide-react';
import { useState } from 'react';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, ShoppingCart, Package, ClipboardList,
  Warehouse, Users, BarChart3, Truck, UserCog, Settings,
};

const menuItems = [
  { label: 'Tổng quan', href: '/dashboard', icon: 'LayoutDashboard' },
  { label: 'Bán hàng', href: '/pos', icon: 'ShoppingCart' },
  { label: 'Sản phẩm', href: '/products', icon: 'Package' },
  { label: 'Đơn hàng', href: '/orders', icon: 'ClipboardList' },
  { label: 'Kho hàng', href: '/inventory', icon: 'Warehouse' },
  { label: 'Khách hàng', href: '/customers', icon: 'Users' },
  { label: 'Báo cáo', href: '/reports', icon: 'BarChart3' },
  { label: 'Nhà cung cấp', href: '/suppliers', icon: 'Truck' },
  { label: 'Nhân viên', href: '/staff', icon: 'UserCog' },
  { label: 'Cài đặt', href: '/settings', icon: 'Settings' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden lg:flex flex-col bg-[#1A202C] text-white transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-[#FF6B35]" />
            <span className="text-lg font-bold text-[#FF6B35]">GenHub</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-white/10 rounded">
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = iconMap[item.icon];
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-[#FF6B35] text-white font-medium'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-gray-500">Cửa hàng Thời Trang Lan</p>
          <p className="text-xs text-gray-600">Gói: Miễn phí</p>
        </div>
      )}
    </aside>
  );
}
