'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function StoreError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('Store error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md text-center">
        <AlertTriangle className="h-12 w-12 text-[#FF6B35] mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
        <p className="text-sm text-gray-500 mb-6">
          Hệ thống gặp sự cố không mong muốn. Vui lòng thử lại hoặc liên hệ hỗ trợ.
        </p>
        <button
          onClick={() => unstable_retry()}
          className="bg-[#FF6B35] text-white px-6 py-2 rounded-lg hover:bg-[#E55A2B] transition-colors"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
