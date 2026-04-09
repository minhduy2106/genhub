'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Menu,
} from 'lucide-react';
import { type AuthUser, useAuthStore } from '@/lib/stores/auth.store';
import { hasPermission, isOwner } from '@/lib/permissions';

const tabs = [
  {
    label: 'Tổng quan',
    href: '/dashboard',
    icon: LayoutDashboard,
    visible: (user: AuthUser | null) =>
      hasPermission(user, 'reports:view'),
  },
  {
    label: 'Bán hàng',
    href: '/pos',
    icon: ShoppingCart,
    visible: (user: AuthUser | null) =>
      hasPermission(user, 'orders:create') &&
      hasPermission(user, 'products:view'),
  },
  {
    label: 'Sản phẩm',
    href: '/products',
    icon: Package,
    visible: (user: AuthUser | null) =>
      hasPermission(user, 'products:view'),
  },
  {
    label: 'Đơn hàng',
    href: '/orders',
    icon: ClipboardList,
    visible: (user: AuthUser | null) =>
      hasPermission(user, 'orders:view'),
  },
  {
    label: 'Thêm',
    href: '/settings',
    icon: Menu,
    visible: (user: AuthUser | null) =>
      isOwner(user),
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const visibleTabs = tabs.filter((tab) => tab.visible(user)).slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="flex items-center justify-around h-14">
        {visibleTabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 text-xs ${
                active ? 'text-[#FF6B35]' : 'text-gray-500'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
