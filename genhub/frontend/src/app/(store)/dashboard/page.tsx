'use client';
import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils/format';
import { StatusBadge } from '@/components/common/StatusBadge';
import { toast } from 'sonner';

interface DashboardData {
  revenue: { total: number };
  orders: { total: number };
  newCustomers: { total: number };
  lowStockCount: number;
  revenueChart: { createdAt: string; _sum: { totalAmount: number } }[];
  topProducts: {
    productId: string;
    _sum: { quantity: number; lineTotal: number };
    product?: { id: string; name: string; sku: string };
  }[];
}

interface Order {
  id: string;
  code: string;
  status: string;
  totalAmount: number;
  customer?: { fullName: string };
  createdAt: string;
}

interface PaginatedOrders {
  data: Order[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [dash, ordersRes] = await Promise.all([
          apiFetch<DashboardData>('/reports/dashboard'),
          apiFetch<PaginatedOrders>('/orders?page=1&limit=5'),
        ]);
        setDashboard(dash);
        setRecentOrders(ordersRes.data ?? []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Không thể tải dữ liệu tổng quan');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Đang tải...</span>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="text-center py-32 text-gray-400">
        Không thể tải dữ liệu. Vui lòng thử lại.
      </div>
    );
  }

  const kpis = [
    {
      label: 'Doanh thu hôm nay',
      value: formatCurrency(Number(dashboard.revenue?.total ?? 0)),
      icon: DollarSign,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Đơn hàng',
      value: dashboard.orders?.total ?? 0,
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Khách hàng mới',
      value: dashboard.newCustomers?.total ?? 0,
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Sắp hết hàng',
      value: dashboard.lowStockCount ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
    },
  ];

  // Group revenue chart by date and sum
  const chartByDate = (dashboard.revenueChart ?? []).reduce<Record<string, number>>((acc, item) => {
    const date = formatDate(item.createdAt);
    acc[date] = (acc[date] ?? 0) + Number(item._sum?.totalAmount ?? 0);
    return acc;
  }, {});
  const chartEntries = Object.entries(chartByDate);
  const maxChartValue = Math.max(...chartEntries.map(([, v]) => v), 1);

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
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Doanh thu 7 ngày</h3>
          {chartEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Chưa có dữ liệu doanh thu</div>
          ) : (
            <div className="space-y-3">
              {chartEntries.map(([date, value]) => (
                <div key={date} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-20 shrink-0">{date}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6">
                    <div
                      className="bg-[#FF6B35] h-6 rounded-full flex items-center justify-end pr-2 min-w-[2rem]"
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

        {/* Top Products */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Top sản phẩm bán chạy</h3>
          {(dashboard.topProducts ?? []).length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Chưa có dữ liệu sản phẩm</div>
          ) : (
            <div className="space-y-3">
              {dashboard.topProducts.map((p, i) => (
                <div key={p.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#FF6B35] w-6">#{i + 1}</span>
                    <span className="text-sm">{p.product?.name ?? p.productId}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(Number(p._sum?.lineTotal ?? 0))}</p>
                    <p className="text-xs text-gray-500">{p._sum?.quantity ?? 0} đã bán</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4">Đơn hàng gần đây</h3>
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Chưa có đơn hàng nào</div>
        ) : (
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
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-3 font-medium text-[#FF6B35]">{order.code}</td>
                    <td className="py-3">{order.customer?.fullName ?? 'Khách lẻ'}</td>
                    <td className="py-3">{formatCurrency(Number(order.totalAmount))}</td>
                    <td className="py-3">
                      <StatusBadge status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
