import { ImageResponse } from 'next/og';

// Icon app TinHub sinh động (dùng cho tab trình duyệt + màn hình chính khi cài PWA)
export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #FF6B35 0%, #FF9046 100%)',
          borderRadius: 96,
          fontSize: 300,
          fontWeight: 800,
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        T
      </div>
    ),
    size,
  );
}
