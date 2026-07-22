'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getToken } from '@/lib/auth';
import { ToastProvider } from '@/components/Toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!getToken()) router.replace('/login');
  }, [router]);

  // Re-aplicar clase dark en cada navegación (Next.js puede limpiarla al reconciliar)
  useEffect(() => {
    const isDark = localStorage.getItem('ctmx_theme') === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
  }, [pathname]);

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 ml-64 overflow-y-auto">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
