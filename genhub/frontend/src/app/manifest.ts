import type { MetadataRoute } from 'next';

// PWA manifest — khi khách "Thêm vào màn hình chính" sẽ có icon + tên + splash TinHub
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TinHub POS - Quản lý bán hàng',
    short_name: 'TinHub',
    description: 'Phần mềm quản lý bán hàng cho SME Việt Nam',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#1A202C',
    theme_color: '#FF6B35',
    lang: 'vi',
    icons: [
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
