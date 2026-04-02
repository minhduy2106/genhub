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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(storeId, query) {
        const [data, total] = await Promise.all([
            this.prisma.inventory.findMany({
                where: { storeId },
                include: { product: true, variant: true },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
            }),
            this.prisma.inventory.count({ where: { storeId } }),
        ]);
        return (0, pagination_dto_1.paginate)(data, total, query.page, query.limit);
    }
    async lowStock(storeId) {
        return this.prisma.inventory.findMany({
            where: {
                storeId,
                quantity: { lte: this.prisma.inventory.fields.lowStockAlert },
            },
            include: { product: true, variant: true },
        });
    }
    async getLowStockItems(storeId) {
        const items = await this.prisma.$queryRaw `
      SELECT i.*, p.name as product_name, p.sku
      FROM inventory i
      JOIN products p ON p.id = i."productId"
      WHERE i."storeId" = ${storeId}
        AND i.quantity <= i."lowStockAlert"
        AND p."deletedAt" IS NULL
    `;
        return items;
    }
    async purchase(storeId, userId, items, supplierId) {
        return this.prisma.$transaction(async (tx) => {
            for (const item of items) {
                const inv = await tx.inventory.findFirst({
                    where: { storeId, productId: item.productId, variantId: item.variantId ?? null },
                });
                if (!inv)
                    throw new common_1.BadRequestException('Không tìm thấy tồn kho');
                await tx.inventory.update({
                    where: { id: inv.id },
                    data: { quantity: { increment: item.quantity }, version: { increment: 1 } },
                });
                await tx.inventoryTransaction.create({
                    data: {
                        storeId, inventoryId: inv.id,
                        productId: item.productId, variantId: item.variantId,
                        type: 'purchase', quantityChange: item.quantity,
                        quantityBefore: inv.quantity,
                        quantityAfter: inv.quantity + item.quantity,
                        unitCost: item.unitCost,
                        referenceType: supplierId ? 'supplier' : undefined,
                        referenceId: supplierId,
                        performedBy: userId,
                    },
                });
            }
            return { message: 'Nhập hàng thành công' };
        });
    }
    async adjustment(storeId, userId, productId, variantId, newQuantity, notes) {
        const inv = await this.prisma.inventory.findFirst({
            where: { storeId, productId, variantId: variantId ?? null },
        });
        if (!inv)
            throw new common_1.BadRequestException('Không tìm thấy tồn kho');
        const change = newQuantity - inv.quantity;
        const type = change >= 0 ? 'adjustment_in' : 'adjustment_out';
        await this.prisma.inventory.update({
            where: { id: inv.id },
            data: { quantity: newQuantity, version: { increment: 1 } },
        });
        await this.prisma.inventoryTransaction.create({
            data: {
                storeId, inventoryId: inv.id, productId, variantId,
                type, quantityChange: change,
                quantityBefore: inv.quantity, quantityAfter: newQuantity,
                notes, performedBy: userId,
            },
        });
        return { message: 'Điều chỉnh tồn kho thành công' };
    }
    async transactions(storeId, query) {
        const [data, total] = await Promise.all([
            this.prisma.inventoryTransaction.findMany({
                where: { storeId },
                include: { product: true, variant: true, performer: { select: { fullName: true } } },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.inventoryTransaction.count({ where: { storeId } }),
        ]);
        return (0, pagination_dto_1.paginate)(data, total, query.page, query.limit);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map