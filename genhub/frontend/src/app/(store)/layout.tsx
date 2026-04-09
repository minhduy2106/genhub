'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { useAuthStore } from '@/lib/stores/auth.store';
import { canAccessPath, getDefaultAuthorizedPath } from '@/lib/permissions';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isRehydrating, rehydrate } = useAuthStore();
  const hydrationAttempted = useRef(false);

  useEffect(() => {
    if (isRehydrating) {
      return;
    }

    if (!user && !hydrationAttempted.current) {
      hydrationAttempted.current = true;
      void rehydrate();
      return;
    }

    if (!user && hydrationAttempted.current && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user && !canAccessPath(user, pathname)) {
      router.replace(getDefaultAuthorizedPath(user));
    }
  }, [isAuthenticated, isRehydrating, pathname, rehydrate, router, user]);
  const ready = !!user && !isRehydrating;

  if (!ready || (user && !canAccessPath(user, pathname))) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[#F7F8FA] p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
