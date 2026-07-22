import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CalorieTrack MX — Portal Profesional',
    short_name: 'CTMX Pro',
    description: 'Panel de gestión nutricional para profesionales de la salud',
    start_url: '/patients',
    display: 'standalone',
    background_color: '#0f0f17',
    theme_color: '#7C3AED',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
