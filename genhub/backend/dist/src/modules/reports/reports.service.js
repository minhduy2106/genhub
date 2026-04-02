"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async dashboard(storeId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const [todayOrders, todayRevenue, newCustomers, lowStock] = await Promise.all([
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
            this.prisma.$queryRaw `
          SELECT COUNT(*) as count FROM inventory
          WHERE "storeId" = ${storeId} AND quantity <= "lowStockAlert"
        `,
        ]);
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
    async revenue(storeId, from, to) {
        const where = {
            storeId, status: 'completed', deletedAt: null,
            ...(from && to && {
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
    async topProducts(storeId, limit = 10) {
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
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map