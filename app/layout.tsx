import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CalorieTrack MX — Portal Profesional',
  description: 'Panel de gestión nutricional para profesionales de la salud',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#7C3AED" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CTMX Pro" />
        {/* Anti-flash: apply saved dark mode before paint */}
        <script dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem('ctmx_theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`
        }} />
      </head>
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
