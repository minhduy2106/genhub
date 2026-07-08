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
      className={`hidden lg:flex flex-col bg-gradient-to-b from-[#1A202C] via-[#1A202C] to-[#141922] text-white transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="flex items-center justify-between h-16 px-3 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF9046] shadow-lg shadow-orange-500/30">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">TinHub</span>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[#FF9046]">
                POS
              </p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-gray-400 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems
          .filter((item) => item.visible(user))
          .map((item) => {
            const Icon = iconMap[item.icon];
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 ${
                  active
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF9046] text-white font-semibold shadow-lg shadow-orange-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white hover:translate-x-0.5'
                }`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 transition-transform duration-150 ${
                    active ? '' : 'group-hover:scale-110'
                  }`}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
      </nav>

      {!collapsed && (
        <div className="p-3">
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <p className="text-xs font-medium text-gray-300 truncate">
              {user?.store?.name ?? 'Cửa hàng'}
            </p>
            <span className="mt-1.5 inline-flex items-center rounded-full bg-[#FF6B35]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#FF9046]">
              Gói: {user?.store?.plan ?? 'Miễn phí'}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
