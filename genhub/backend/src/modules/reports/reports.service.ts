import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private formatChartDate(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async dashboard(storeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayOrders, todayRevenue, newCustomers, lowStockCount] =
      await Promise.all([
        this.prisma.order.count({
          where: {
            storeId,
            deletedAt: null,
            status: { in: ['completed', 'confirmed', 'processing'] },
            createdAt: { gte: today, lt: tomorrow },
          },
        }),
        this.prisma.order.aggregate({
          where: {
            storeId,
            status: 'completed',
            deletedAt: null,
            createdAt: { gte: today, lt: tomorrow },
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.customer.count({
          where: { storeId, deletedAt: null, createdAt: { gte: today } },
        }),
        this.prisma.inventory.findMany({
          where: {
            storeId,
            product: { deletedAt: null },
          },
          select: {
            quantity: true,
            lowStockAlert: true,
          },
        }),
      ]);

    // Doanh thu 7 ngày
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const revenueOrders = await this.prisma.order.findMany({
      where: {
        storeId,
        status: 'completed',
        deletedAt: null,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const chartMap = new Map<
      string,
      { date: string; revenue: number; orders: number }
    >();

    for (const order of revenueOrders) {
      const dateKey = this.formatChartDate(order.createdAt);
      const current = chartMap.get(dateKey) ?? {
        date: dateKey,
        revenue: 0,
        orders: 0,
      };
      current.revenue += Number(order.totalAmount ?? 0);
      current.orders += 1;
      chartMap.set(dateKey, current);
    }

    const revenueChart = Array.from(chartMap.values());

    // Top 5 sản phẩm bán chạy
    const topItems = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          storeId,
          status: 'completed',
          deletedAt: null,
          createdAt: { gte: sevenDaysAgo },
        },
      },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    // Join product names
    const productIds = topItems.map((i) => i.productId);
    const products = productIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, sku: true },
        })
      : [];
    const topProducts = topItems.map((item) => ({
      ...item,
      _sum: {
        quantity: Number(item._sum.quantity ?? 0),
        lineTotal: Number(item._sum.lineTotal ?? 0),
      },
      product: products.find((p) => p.id === item.productId) ?? null,
    }));

    return {
      revenue: { total: Number(todayRevenue._sum.totalAmount ?? 0) },
      orders: { total: todayOrders },
      newCustomers: { total: newCustomers },
      lowStockCount: lowStockCount.filter(
        (item) => item.quantity <= item.lowStockAlert,
      ).length,
      revenueChart,
      topProducts,
    };
  }

  async revenue(storeId: string, from?: string, to?: string) {
    if (from && isNaN(new Date(from).getTime())) {
      throw new BadRequestException(
        'Invalid "from" date format. Use ISO 8601.',
      );
    }
    if (to && isNaN(new Date(to).getTime())) {
      throw new BadRequestException('Invalid "to" date format. Use ISO 8601.');
    }
    const where = {
      storeId,
      status: 'completed' as const,
      deletedAt: null,
      ...(from &&
        to && {
          createdAt: { gte: new Date(from), lte: new Date(to) },
        }),
    };
    const orders = await this.prisma.order.findMany({
      where,
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const total = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    return { total, orders };
  }

  async topProducts(storeId: string, limit = 10) {
    if (!Number.isFinite(limit) || limit <= 0) {
      throw new BadRequestException('Limit phải lớn hơn 0');
    }

    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { storeId, status: 'completed', deletedAt: null },
      },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: Math.min(limit, 50),
    });

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });

    return items.map((item) => ({
      ...item,
      _sum: {
        quantity: Number(item._sum.quantity ?? 0),
        lineTotal: Number(item._sum.lineTotal ?? 0),
      },
      product: products.find((p) => p.id === item.productId),
    }));
  }
}
