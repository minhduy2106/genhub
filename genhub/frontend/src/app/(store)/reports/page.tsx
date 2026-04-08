'use client';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils/format';

interface DashboardData {
  revenue: { total: number };
  orders: { total: number };
  newCustomers: { total: number };
  lowStockCount: number;
  revenueChart: { date: string; revenue: number; orders: number }[];
  topProducts: {
    productId: string;
    _sum: { quantity: number; lineTotal: number };
    product?: { id: string; name: string; sku: string };
  }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFetch<DashboardData>('/reports/dashboard');
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu báo cáo');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Đang tải...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-32 text-red-500">
        {error ?? 'Không thể tải dữ liệu. Vui lòng thử lại.'}
      </div>
    );
  }

  const revenue = Number(data.revenue?.total ?? 0);
  const orders = data.orders?.total ?? 0;
  const estimatedProfit = Math.round(revenue * 0.25);

  // Build revenue chart from daily-aggregated data
  const chartByDate = (data.revenueChart ?? []).reduce<Record<string, number>>((acc, item) => {
    const date = formatDate(item.date);
    acc[date] = (acc[date] ?? 0) + Number(item.revenue ?? 0);
    return acc;
  }, {});
  const chartEntries = Object.entries(chartByDate);
  const maxChartValue = Math.max(...chartEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Báo cáo</h1>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Doanh thu hôm nay</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(revenue)}</p>
          <p className="text-sm text-gray-400 mt-1">Dữ liệu thực tế</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Đơn hàng hôm nay</p>
          <p className="text-3xl font-bold mt-2">{orders}</p>
          <p className="text-sm text-gray-400 mt-1">Dữ liệu thực tế</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Lợi nhuận ước tính (25%)</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(estimatedProfit)}</p>
          <p className="text-sm text-gray-400 mt-1">Ước tính, không dựa trên giá vốn thực tế</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Doanh thu 7 ngày gần đây</h3>
        {chartEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Chưa có dữ liệu doanh thu</div>
        ) : (
          <div className="space-y-4">
            {chartEntries.map(([date, value]) => (
              <div key={date} className="flex items-center gap-4">
                <span className="text-sm text-gray-500 w-20 shrink-0">{date}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                  <div
                    className="bg-[#FF6B35] h-8 rounded-full flex items-center justify-end pr-3 min-w-[2rem]"
                    style={{ width: `${(value / maxChartValue) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium whitespace-nowrap">
                      {formatCurrency(value)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Top sản phẩm bán chạy</h3>
        {(data.topProducts ?? []).length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Chưa có dữ liệu sản phẩm</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Sản phẩm</th>
                <th className="pb-3 font-medium text-right">Số lượng</th>
                <th className="pb-3 font-medium text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((p, i) => (
                <tr key={p.productId} className="border-b last:border-0">
                  <td className="py-3 font-bold text-[#FF6B35]">{i + 1}</td>
                  <td className="py-3">{p.product?.name ?? p.productId}</td>
                  <td className="py-3 text-right">{p._sum?.quantity ?? 0}</td>
                  <td className="py-3 text-right font-medium">
                    {formatCurrency(Number(p._sum?.lineTotal ?? 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
