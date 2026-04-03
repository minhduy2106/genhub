'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { useAuthStore } from '@/lib/stores/auth.store';

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, isRehydrating, rehydrate } = useAuthStore();

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    if (isAuthenticated && !user && !isRehydrating) {
      void rehydrate();
    }
  }, [accessToken, isAuthenticated, user, isRehydrating, rehydrate, router]);

  const ready = !!accessToken && !isRehydrating && (!!user || !isAuthenticated);

  if (!ready) {
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
