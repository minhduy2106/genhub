import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async dashboard(storeId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayOrders, todayRevenue, newCustomers, lowStock] =
      await Promise.all([
        this.prisma.order.count({
          where: {
            storeId, deletedAt: null,
            status: { in: ['completed', 'confirmed', 'processing'] },
            createdAt: { gte: today, lt: tomorrow },
          },
        }),
        this.prisma.order.aggregate({
          where: {
            storeId, status: 'completed', deletedAt: null,
            createdAt: { gte: today, lt: tomorrow },
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.customer.count({
          where: { storeId, deletedAt: null, createdAt: { gte: today } },
        }),
        this.prisma.$queryRaw`
          SELECT COUNT(*) as count FROM inventory
          WHERE "storeId" = ${storeId} AND quantity <= "lowStockAlert"
        ` as Promise<{ count: bigint }[]>,
      ]);

    // Doanh thu 7 ngày
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const revenueChart = await this.prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        storeId, status: 'completed', deletedAt: null,
        createdAt: { gte: sevenDaysAgo },
      },
      _sum: { totalAmount: true },
    });

    // Top 5 sản phẩm bán chạy
    const topProducts = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { storeId, status: 'completed', deletedAt: null,
          createdAt: { gte: sevenDaysAgo } },
      },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    return {
      revenue: { total: todayRevenue._sum.totalAmount ?? 0 },
      orders: { total: todayOrders },
      newCustomers: { total: newCustomers },
      lowStockCount: Number(lowStock[0]?.count ?? 0),
      revenueChart,
      topProducts,
    };
  }

  async revenue(storeId: string, from?: string, to?: string) {
    const where = {
      storeId, status: 'completed' as const, deletedAt: null as null,
      ...(from && to && {
        createdAt: { gte: new Date(from), lte: new Date(to) },
      }),
    };
    const orders = await this.prisma.order.findMany({
      where,
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const total = orders.reduce(
      (sum, o) => sum + Number(o.totalAmount), 0,
    );
    return { total, orders };
  }

  async topProducts(storeId: string, limit = 10) {
    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: { storeId, status: 'completed', deletedAt: null },
      },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true },
    });

    return items.map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.productId),
    }));
  }
}
