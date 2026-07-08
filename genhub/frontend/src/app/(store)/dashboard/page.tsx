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
  revenueChart: { date: string; revenue: number; orders: number }[];
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
      const [dashResult, ordersResult] = await Promise.allSettled([
        apiFetch<DashboardData>('/reports/dashboard'),
        apiFetch<PaginatedOrders>('/orders?page=1&limit=5'),
      ]);

      if (dashResult.status === 'fulfilled') {
        setDashboard(dashResult.value);
      } else {
        toast.error(
          dashResult.reason instanceof Error
            ? dashResult.reason.message
            : 'Không thể tải dữ liệu tổng quan',
        );
      }

      if (ordersResult.status === 'fulfilled') {
        setRecentOrders(ordersResult.value?.data ?? []);
      }
      // Orders failure is non-critical — dashboard still renders without recent orders

      setLoading(false);
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

  // If dashboard failed to load, show empty state with 0 values
  const dash: DashboardData = dashboard ?? {
    revenue: { total: 0 },
    orders: { total: 0 },
    newCustomers: { total: 0 },
    lowStockCount: 0,
    revenueChart: [],
    topProducts: [],
  };

  const kpis = [
    {
      label: 'Đơn hàng',
      value: dash.orders?.total ?? 0,
      icon: ShoppingCart,
      chip: 'text-blue-600 bg-blue-50',
      bar: 'from-blue-400 to-blue-500',
    },
    {
      label: 'Khách hàng mới',
      value: dash.newCustomers?.total ?? 0,
      icon: Users,
      chip: 'text-purple-600 bg-purple-50',
      bar: 'from-purple-400 to-purple-500',
    },
    {
      label: 'Sắp hết hàng',
      value: dash.lowStockCount ?? 0,
      icon: AlertTriangle,
      chip: 'text-red-600 bg-red-50',
      bar: 'from-red-400 to-red-500',
    },
  ];

  // Group revenue chart by date and sum
  const chartByDate = (dash.revenueChart ?? []).reduce<Record<string, number>>((acc, item) => {
    const date = formatDate(item.date);
    acc[date] = (acc[date] ?? 0) + Number(item.revenue ?? 0);
    return acc;
  }, {});
  const chartEntries = Object.entries(chartByDate);
  const maxChartValue = Math.max(...chartEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tổng quan</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Tình hình kinh doanh hôm nay của cửa hàng
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hero: doanh thu hôm nay */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF9046] p-4 text-white shadow-lg shadow-orange-500/30 transition-transform duration-200 hover:-translate-y-0.5">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
          <div className="absolute -right-1 top-10 h-14 w-14 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/85">Doanh thu hôm nay</p>
              <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="text-2xl font-bold mt-1 tracking-tight">
              {formatCurrency(Number(dash.revenue?.total ?? 0))}
            </p>
          </div>
        </div>

        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="relative overflow-hidden bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                <p className="text-2xl font-bold mt-1 tracking-tight">{kpi.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${kpi.chip}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
            <div
              className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${kpi.bar} opacity-70`}
            />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-[#FF6B35] to-[#FF9046]" />
            <h3 className="font-semibold">Doanh thu 7 ngày</h3>
          </div>
          {chartEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Chưa có dữ liệu doanh thu</div>
          ) : (
            <div className="space-y-3">
              {chartEntries.map(([date, value]) => (
                <div key={date} className="flex items-center gap-3 group">
                  <span className="text-sm text-gray-500 w-20 shrink-0">{date}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6">
                    <div
                      className="bg-gradient-to-r from-[#FF6B35] to-[#FF9046] h-6 rounded-full flex items-center justify-end pr-2 min-w-[2rem] shadow-sm shadow-orange-500/20 transition-all duration-300 group-hover:brightness-105"
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
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <span className="h-4 w-1 rounded-full bg-gradient-to-b from-[#FF6B35] to-[#FF9046]" />
            <h3 className="font-semibold">Top sản phẩm bán chạy</h3>
          </div>
          {(dash.topProducts ?? []).length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Chưa có dữ liệu sản phẩm</div>
          ) : (
            <div className="space-y-1.5">
              {dash.topProducts.map((p, i) => {
                const rankStyle =
                  i === 0
                    ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-sm'
                    : i === 1
                      ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white'
                      : i === 2
                        ? 'bg-gradient-to-br from-orange-300 to-orange-400 text-white'
                        : 'bg-gray-100 text-gray-500';
                return (
                  <div
                    key={p.productId}
                    className="flex items-center justify-between rounded-xl px-2 py-1.5 transition-colors hover:bg-orange-50/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${rankStyle}`}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm truncate">{p.product?.name ?? p.productId}</span>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold">{formatCurrency(Number(p._sum?.lineTotal ?? 0))}</p>
                      <p className="text-xs text-gray-500">{p._sum?.quantity ?? 0} đã bán</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="h-4 w-1 rounded-full bg-gradient-to-b from-[#FF6B35] to-[#FF9046]" />
          <h3 className="font-semibold">Đơn hàng gần đây</h3>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Chưa có đơn hàng nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="pb-3 font-semibold">Mã đơn</th>
                  <th className="pb-3 font-semibold">Khách hàng</th>
                  <th className="pb-3 font-semibold">Tổng tiền</th>
                  <th className="pb-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b last:border-0 transition-colors hover:bg-orange-50/50"
                  >
                    <td className="py-3 font-medium text-[#FF6B35]">{order.code}</td>
                    <td className="py-3">{order.customer?.fullName ?? 'Khách lẻ'}</td>
                    <td className="py-3 font-medium">{formatCurrency(Number(order.totalAmount))}</td>
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
