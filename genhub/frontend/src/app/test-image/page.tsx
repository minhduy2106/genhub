'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch, resolveAssetUrl } from '@/lib/api';

interface ProductImage {
  url: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  images?: ProductImage[];
}

interface ProductsResponse {
  data: Product[];
}

interface ImageCheckResult {
  productId: string;
  productName: string;
  rawUrl: string | null;
  resolvedUrl: string | null;
  status: 'ok' | 'missing' | 'error';
  error?: string;
}

export default function TestImagePage() {
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [results, setResults] = useState<ImageCheckResult[]>([]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setApiError(null);

      try {
        const response = await apiFetch<ProductsResponse | Product[]>(
          '/products?page=1&limit=20',
        );
        const products = Array.isArray(response) ? response : response.data ?? [];

        const checks = await Promise.all(
          products.map(async (product): Promise<ImageCheckResult> => {
            const rawUrl = product.images?.[0]?.url ?? null;
            const resolvedUrl = resolveAssetUrl(rawUrl);

            if (!resolvedUrl) {
              return {
                productId: product.id,
                productName: product.name,
                rawUrl,
                resolvedUrl,
                status: 'missing',
              };
            }

            try {
              const res = await fetch(resolvedUrl, { method: 'HEAD' });
              if (!res.ok) {
                return {
                  productId: product.id,
                  productName: product.name,
                  rawUrl,
                  resolvedUrl,
                  status: 'error',
                  error: `HTTP ${res.status}`,
                };
              }

              return {
                productId: product.id,
                productName: product.name,
                rawUrl,
                resolvedUrl,
                status: 'ok',
              };
            } catch (error) {
              return {
                productId: product.id,
                productName: product.name,
                rawUrl,
                resolvedUrl,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          }),
        );

        setResults(checks);
      } catch (error) {
        setApiError(
          error instanceof Error ? error.message : 'Không gọi được API sản phẩm',
        );
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Test API Hình Sản Phẩm</h1>
          <p className="text-sm text-gray-500">
            Kiểm tra API trả URL ảnh và UI render ảnh thật.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[#FF6B35] px-4 py-2 text-sm font-medium text-white hover:from-[#F0561D] hover:to-[#FF813A]"
        >
          Test lại
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Đang kiểm tra API hình...
        </div>
      )}

      {!loading && apiError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-600">
          Lỗi API: {apiError}
        </div>
      )}

      {!loading && !apiError && (
        <div className="grid gap-4">
          {results.map((item) => (
            <div
              key={item.productId}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                <div className="flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-xs text-gray-400">
                  {item.resolvedUrl ? (
                    <img
                      src={item.resolvedUrl}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    'Không có ảnh'
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Sản phẩm:</span>{' '}
                    {item.productName}
                  </div>
                  <div>
                    <span className="font-semibold">Raw URL từ API:</span>{' '}
                    <code className="break-all">{item.rawUrl ?? 'null'}</code>
                  </div>
                  <div>
                    <span className="font-semibold">
                      Resolved URL đưa lên UI:
                    </span>{' '}
                    <code className="break-all">
                      {item.resolvedUrl ?? 'null'}
                    </code>
                  </div>
                  <div>
                    <span className="font-semibold">Kết quả:</span>{' '}
                    <span
                      className={
                        item.status === 'ok'
                          ? 'text-green-600'
                          : item.status === 'missing'
                            ? 'text-amber-600'
                            : 'text-red-600'
                      }
                    >
                      {item.status === 'ok'
                        ? 'Ảnh tải được'
                        : item.status === 'missing'
                          ? 'API chưa trả ảnh'
                          : `Lỗi tải ảnh: ${item.error}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
