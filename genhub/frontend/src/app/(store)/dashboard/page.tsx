'use client';
import { DollarSign, ShoppingCart, Users, AlertTriangle } from 'lucide-react';
import { mockDashboard, mockOrders } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/utils/format';
import { StatusBadge } from '@/components/common/StatusBadge';

const kpis = [
  { label: 'Doanh thu hôm nay', value: formatCurrency(mockDashboard.revenue), icon: DollarSign, color: 'text-green-600 bg-green-50' },
  { label: 'Đơn hàng', value: mockDashboard.orders, icon: ShoppingCart, color: 'text-blue-600 bg-blue-50' },
  { label: 'Khách hàng mới', value: mockDashboard.newCustomers, icon: Users, color: 'text-purple-600 bg-purple-50' },
  { label: 'Sắp hết hàng', value: mockDashboard.lowStockCount, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tổng quan</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold mt-1">{kpi.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart placeholder */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Doanh thu 7 ngày</h3>
          <div className="space-y-3">
            {mockDashboard.revenueChart.map((day) => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="text-sm text-gray-500 w-12">{day.date}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6">
                  <div
                    className="bg-[#FF6B35] h-6 rounded-full flex items-center justify-end pr-2"
                    style={{ width: `${(day.value / 10000000) * 100}%` }}
                  >
                    <span className="text-xs text-white font-medium">{formatCurrency(day.value)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Top sản phẩm bán chạy</h3>
          <div className="space-y-3">
            {mockDashboard.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#FF6B35] w-6">#{i + 1}</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(p.revenue)}</p>
                  <p className="text-xs text-gray-500">{p.quantity} đã bán</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Đơn hàng gần đây</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Mã đơn</th>
                <th className="pb-3 font-medium">Khách hàng</th>
                <th className="pb-3 font-medium">Tổng tiền</th>
                <th className="pb-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.slice(0, 5).map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-3 font-medium text-[#FF6B35]">{order.code}</td>
                  <td className="py-3">{order.customerName}</td>
                  <td className="py-3">{formatCurrency(order.totalAmount)}</td>
                  <td className="py-3"><StatusBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
