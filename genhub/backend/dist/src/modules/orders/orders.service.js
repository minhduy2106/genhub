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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
const generate_code_util_1 = require("../../common/utils/generate-code.util");
let OrdersService = class OrdersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(storeId, query) {
        const where = {
            storeId,
            deletedAt: null,
            ...(query.status && { status: query.status }),
        };
        const [data, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: { customer: true, items: true, payments: true },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where }),
        ]);
        return (0, pagination_dto_1.paginate)(data, total, query.page, query.limit);
    }
    async findOne(id, storeId) {
        const order = await this.prisma.order.findFirst({
            where: { id, storeId, deletedAt: null },
            include: {
                customer: true,
                items: { include: { product: true, variant: true } },
                payments: true,
                createdBy: { select: { fullName: true } },
            },
        });
        if (!order)
            throw new common_1.NotFoundException('Không tìm thấy đơn hàng');
        return order;
    }
    async createPosOrder(storeId, userId, dto) {
        return this.prisma.$transaction(async (tx) => {
            const store = await tx.store.update({
                where: { id: storeId },
                data: { invoiceCounter: { increment: 1 } },
            });
            const code = (0, generate_code_util_1.generateOrderCode)(store.invoiceCounter);
            let subtotal = 0;
            const orderItems = [];
            for (const item of dto.items) {
                const product = await tx.product.findFirst({
                    where: { id: item.productId, storeId, deletedAt: null },
                });
                if (!product) {
                    throw new common_1.BadRequestException(`Sản phẩm không tồn tại`);
                }
                const inv = await tx.inventory.findFirst({
                    where: {
                        storeId, productId: item.productId,
                        variantId: item.variantId ?? null,
                    },
                });
                if (!inv || inv.quantity < item.quantity) {
                    throw new common_1.BadRequestException(`Sản phẩm "${product.name}" không đủ tồn kho`);
                }
                const updated = await tx.inventory.updateMany({
                    where: {
                        id: inv.id,
                        version: inv.version,
                        quantity: { gte: item.quantity },
                    },
                    data: {
                        quantity: { decrement: item.quantity },
                        version: { increment: 1 },
                    },
                });
                if (updated.count === 0) {
                    throw new common_1.BadRequestException(`Sản phẩm "${product.name}" vừa được cập nhật, vui lòng thử lại`);
                }
                await tx.inventoryTransaction.create({
                    data: {
                        storeId, inventoryId: inv.id,
                        productId: item.productId, variantId: item.variantId,
                        type: 'sale', quantityChange: -item.quantity,
                        quantityBefore: inv.quantity,
                        quantityAfter: inv.quantity - item.quantity,
                        unitCost: product.costPrice,
                        referenceType: 'order', performedBy: userId,
                    },
                });
                const discount = item.discountAmount ?? 0;
                const lineTotal = item.unitPrice * item.quantity - discount;
                subtotal += lineTotal;
                orderItems.push({
                    productId: item.productId,
                    variantId: item.variantId,
                    productSnapshot: { name: product.name, sku: product.sku },
                    unitPrice: item.unitPrice,
                    unitCost: product.costPrice,
                    quantity: item.quantity,
                    discountAmount: discount,
                    lineTotal,
                });
            }
            const orderDiscount = dto.discountAmount ?? 0;
            const totalAmount = subtotal - orderDiscount;
            const paidAmount = dto.payments.reduce((s, p) => s + p.amount, 0);
            const order = await tx.order.create({
                data: {
                    storeId, code, customerId: dto.customerId,
                    channel: 'pos', status: 'completed',
                    subtotal, discountAmount: orderDiscount,
                    discountType: dto.discountType,
                    totalAmount, paidAmount,
                    createdById: userId,
                    completedAt: new Date(),
                    items: { createMany: { data: orderItems } },
                },
                include: { items: true },
            });
            for (const p of dto.payments) {
                await tx.payment.create({
                    data: {
                        orderId: order.id, storeId,
                        method: p.method, amount: p.amount,
                        status: 'completed', processedById: userId,
                    },
                });
            }
            if (dto.customerId) {
                await tx.customer.update({
                    where: { id: dto.customerId },
                    data: {
                        totalOrders: { increment: 1 },
                        totalSpent: { increment: totalAmount },
                        lastOrderAt: new Date(),
                    },
                });
            }
            return {
                order: { id: order.id, code, totalAmount, status: 'completed' },
                changeAmount: paidAmount - totalAmount,
            };
        });
    }
    async cancel(id, storeId, userId, reason) {
        const order = await this.findOne(id, storeId);
        if (order.status === 'cancelled') {
            throw new common_1.BadRequestException('Đơn hàng đã bị hủy');
        }
        return this.prisma.$transaction(async (tx) => {
            for (const item of order.items) {
                await tx.inventory.updateMany({
                    where: {
                        storeId, productId: item.productId,
                        variantId: item.variantId ?? null,
                    },
                    data: { quantity: { increment: item.quantity } },
                });
            }
            return tx.order.update({
                where: { id },
                data: {
                    status: 'cancelled',
                    cancelledById: userId,
                    cancelledReason: reason ?? 'Hủy đơn',
                },
            });
        });
    }
    async complete(id, storeId) {
        await this.findOne(id, storeId);
        return this.prisma.order.update({
            where: { id },
            data: { status: 'completed', completedAt: new Date() },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map