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
exports.ShiftsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ShiftsService = class ShiftsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async open(storeId, userId, openingCash) {
        const existing = await this.prisma.shift.findFirst({
            where: { storeId, openedById: userId, status: 'open' },
        });
        if (existing)
            throw new common_1.BadRequestException('Bạn đang có ca mở, vui lòng đóng ca trước');
        return this.prisma.shift.create({
            data: { storeId, openedById: userId, openingCash, status: 'open' },
        });
    }
    async close(id, storeId, userId, closingCash, notes) {
        const shift = await this.prisma.shift.findFirst({ where: { id, storeId, status: 'open' } });
        if (!shift)
            throw new common_1.NotFoundException('Không tìm thấy ca đang mở');
        const orders = await this.prisma.order.aggregate({
            where: { storeId, status: 'completed', createdAt: { gte: shift.openedAt } },
            _sum: { totalAmount: true },
            _count: true,
        });
        const totalRevenue = Number(orders._sum.totalAmount ?? 0);
        const expectedCash = Number(shift.openingCash) + totalRevenue;
        return this.prisma.shift.update({
            where: { id },
            data: {
                closedById: userId, closingCash, expectedCash,
                cashDifference: closingCash - expectedCash,
                totalOrders: orders._count, totalRevenue,
                notes, closedAt: new Date(), status: 'closed',
            },
        });
    }
    async current(storeId, userId) {
        return this.prisma.shift.findFirst({
            where: { storeId, openedById: userId, status: 'open' },
        });
    }
    async findAll(storeId) {
        return this.prisma.shift.findMany({
            where: { storeId },
            include: { openedBy: { select: { fullName: true } }, closedBy: { select: { fullName: true } } },
            orderBy: { openedAt: 'desc' },
            take: 50,
        });
    }
};
exports.ShiftsService = ShiftsService;
exports.ShiftsService = ShiftsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShiftsService);
//# sourceMappingURL=shifts.service.js.map