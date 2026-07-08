'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { buildVietQRPayload, type VietQRParams } from './vietqr';

// Tạo data URL ảnh QR VietQR một lần (dùng khi cần QR ngay, VD lúc in hóa đơn)
export async function generateVietQRDataUrl(
  params: VietQRParams,
): Promise<string | null> {
  if (!params.bankBin || !params.accountNumber) return null;
  try {
    return await QRCode.toDataURL(buildVietQRPayload(params), {
      margin: 1,
      width: 240,
      errorCorrectionLevel: 'M',
    });
  } catch {
    return null;
  }
}

// Trả về data URL ảnh QR VietQR, hoặc null khi thiếu thông tin / đang render
export function useVietQRDataUrl(params: VietQRParams | null): string | null {
  const [qr, setQr] = useState<{ payload: string; url: string } | null>(null);

  const payload =
    params && params.bankBin && params.accountNumber
      ? buildVietQRPayload(params)
      : null;

  useEffect(() => {
    if (!payload) return;
    let cancelled = false;
    QRCode.toDataURL(payload, { margin: 1, width: 240, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setQr({ payload, url });
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  return payload && qr?.payload === payload ? qr.url : null;
}
