'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Users, LogOut, Settings, BarChart2, Moon, Sun, FileText, LayoutDashboard, Sigma } from 'lucide-react';
import { clearSession, getUser } from '@/lib/auth';

const NAV = [
  { href: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/patients',   icon: Users,            label: 'Mis pacientes' },
  { href: '/templates',  icon: FileText,          label: 'Plantillas' },
  { href: '/calculator', icon: Sigma,             label: 'Calculadora' },
  { href: '/settings',   icon: Settings,          label: 'Ajustes' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const user     = getUser();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ctmx_theme') === 'dark';
    setDark(saved);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('ctmx_theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  const handleLogout = () => { clearSession(); router.push('/login'); };

  return (
    <aside className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-prof-600 flex items-center justify-center">
            <BarChart2 size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">CalorieTrack MX</p>
            <p className="text-xs text-prof-600 font-medium">Portal Profesional</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-prof-50 text-prof-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={17} className={active ? 'text-prof-600' : 'text-gray-400'} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <button
          onClick={toggleDark}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          {dark ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-gray-400" />}
          {dark ? 'Modo claro' : 'Modo oscuro'}
        </button>

        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-prof-100 flex items-center justify-center text-prof-700 font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase() ?? 'P'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name ?? 'Profesional'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email ?? ''}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
