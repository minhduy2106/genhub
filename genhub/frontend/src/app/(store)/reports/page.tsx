'use client';
import { mockDashboard } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils/format';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Báo cáo</h1>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Doanh thu hôm nay</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(mockDashboard.revenue)}</p>
          <p className="text-sm text-green-600 mt-1">+12.5% so với hôm qua</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Đơn hàng hôm nay</p>
          <p className="text-3xl font-bold mt-2">{mockDashboard.orders}</p>
          <p className="text-sm text-green-600 mt-1">+5.3% so với hôm qua</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <p className="text-sm text-gray-500">Lợi nhuận ước tính</p>
          <p className="text-3xl font-bold mt-2">{formatCurrency(Math.round(mockDashboard.revenue * 0.25))}</p>
          <p className="text-sm text-gray-500 mt-1">Biên lợi nhuận: 25%</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Doanh thu 7 ngày gần đây</h3>
        <div className="space-y-4">
          {mockDashboard.revenueChart.map((day) => (
            <div key={day.date} className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-14">{day.date}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-8 relative">
                <div
                  className="bg-[#FF6B35] h-8 rounded-full flex items-center justify-end pr-3"
                  style={{ width: `${(day.value / 10000000) * 100}%` }}
                >
                  <span className="text-xs text-white font-medium">{formatCurrency(day.value)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Top sản phẩm bán chạy</h3>
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
            {mockDashboard.topProducts.map((p, i) => (
              <tr key={p.name} className="border-b last:border-0">
                <td className="py-3 font-bold text-[#FF6B35]">{i + 1}</td>
                <td className="py-3">{p.name}</td>
                <td className="py-3 text-right">{p.quantity}</td>
                <td className="py-3 text-right font-medium">{formatCurrency(p.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
