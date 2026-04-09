'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList,
  Warehouse, Users, BarChart3, Settings, ChevronLeft, Store,
} from 'lucide-react';
import { useState } from 'react';
import { type AuthUser, useAuthStore } from '@/lib/stores/auth.store';
import { hasPermission, isOwner } from '@/lib/permissions';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, ShoppingCart, Package, ClipboardList,
  Warehouse, Users, BarChart3, Settings,
};

const menuItems = [
  {
    label: 'Tổng quan',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    visible: (roleUser: AuthUser | null) =>
      hasPermission(roleUser, 'reports:view'),
  },
  {
    label: 'Bán hàng',
    href: '/pos',
    icon: 'ShoppingCart',
    visible: (roleUser: AuthUser | null) =>
      hasPermission(roleUser, 'orders:create') &&
      hasPermission(roleUser, 'products:view'),
  },
  {
    label: 'Sản phẩm',
    href: '/products',
    icon: 'Package',
    visible: (roleUser: AuthUser | null) =>
      hasPermission(roleUser, 'products:view'),
  },
  {
    label: 'Đơn hàng',
    href: '/orders',
    icon: 'ClipboardList',
    visible: (roleUser: AuthUser | null) =>
      hasPermission(roleUser, 'orders:view'),
  },
  {
    label: 'Kho hàng',
    href: '/inventory',
    icon: 'Warehouse',
    visible: (roleUser: AuthUser | null) =>
      hasPermission(roleUser, 'inventory:view'),
  },
  {
    label: 'Khách hàng',
    href: '/customers',
    icon: 'Users',
    visible: (roleUser: AuthUser | null) =>
      hasPermission(roleUser, 'customers:view'),
  },
  {
    label: 'Báo cáo',
    href: '/reports',
    icon: 'BarChart3',
    visible: (roleUser: AuthUser | null) =>
      hasPermission(roleUser, 'reports:view'),
  },
  {
    label: 'Cài đặt',
    href: '/settings',
    icon: 'Settings',
    visible: (roleUser: AuthUser | null) =>
      isOwner(roleUser),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuthStore();

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
        {menuItems
          .filter((item) => item.visible(user))
          .map((item) => {
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
          <p className="text-xs text-gray-500">{user?.store?.name ?? 'Cửa hàng'}</p>
          <p className="text-xs text-gray-600">Gói: {user?.store?.plan ?? 'Miễn phí'}</p>
        </div>
      )}
    </aside>
  );
}
