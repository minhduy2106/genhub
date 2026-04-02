'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingCart, Package, ClipboardList, Menu } from 'lucide-react';

const tabs = [
  { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Bán hàng', href: '/pos', icon: ShoppingCart },
  { label: 'Sản phẩm', href: '/products', icon: Package },
  { label: 'Đơn hàng', href: '/orders', icon: ClipboardList },
  { label: 'Thêm', href: '/settings', icon: Menu },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
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
