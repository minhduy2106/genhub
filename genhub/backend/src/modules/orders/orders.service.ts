import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import {
  generateOrderCode,
  generateCustomerCode,
} from '../../common/utils/generate-code.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(storeId: string, query: OrderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.OrderWhereInput = {
      storeId,
      deletedAt: null,
      ...(query.status && { status: query.status }),
    };
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { customer: true, items: true, payments: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async findOne(id: string, storeId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, storeId, deletedAt: null },
      include: {
        customer: true,
        items: { include: { product: true, variant: true } },
        payments: true,
        createdBy: { select: { fullName: true } },
      },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  /** POS Order: 1 transaction - tạo đơn + trừ kho + thanh toán */
  async createPosOrder(
    storeId: string,
    userId: string,
    dto: CreatePosOrderDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 0. Auto-create customer nếu không có customerId nhưng có customerName/customerPhone
      let resolvedCustomerId = dto.customerId ?? null;
      if (!resolvedCustomerId && dto.customerName && dto.customerPhone) {
        const existing = await tx.customer.findFirst({
          where: { storeId, phone: dto.customerPhone, deletedAt: null },
        });
        if (existing) {
          resolvedCustomerId = existing.id;
        } else {
          const customerCount = await tx.customer.count({ where: { storeId } });
          const code = generateCustomerCode(customerCount + 1);
          const newCustomer = await tx.customer.create({
            data: {
              storeId,
              code,
              fullName: dto.customerName,
              phone: dto.customerPhone,
            },
          });
          resolvedCustomerId = newCustomer.id;
        }
      }

      // 1. Sinh mã đơn
      const store = await tx.store.update({
        where: { id: storeId },
        data: { invoiceCounter: { increment: 1 } },
      });
      const code = generateOrderCode(store.invoiceCounter);

      // 2. Validate & build order items
      let subtotal = 0;
      const orderItems: Prisma.OrderItemCreateManyOrderInput[] = [];
      const inventoryTransactionData: {
        storeId: string;
        inventoryId: string;
        productId: string;
        variantId?: string;
        quantityChange: number;
        quantityBefore: number;
        quantityAfter: number;
        unitCost: Prisma.Decimal | null;
      }[] = [];

      for (const item of dto.items) {
        const product = await tx.product.findFirst({
          where: {
            id: item.productId,
            storeId,
            deletedAt: null,
            status: 'active',
          },
        });
        if (!product) {
          throw new BadRequestException(`Sản phẩm không tồn tại`);
        }

        // Trừ tồn kho (optimistic locking)
        const inv = await tx.inventory.findFirst({
          where: {
            storeId,
            productId: item.productId,
            variantId: item.variantId ?? null,
          },
        });
        if (!inv || inv.quantity < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm "${product.name}" không đủ tồn kho`,
          );
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
          throw new BadRequestException(
            `Sản phẩm "${product.name}" vừa được cập nhật, vui lòng thử lại`,
          );
        }

        // Collect inventory transaction data (created after order for referenceId)
        inventoryTransactionData.push({
          storeId,
          inventoryId: inv.id,
          productId: item.productId,
          variantId: item.variantId,
          quantityChange: -item.quantity,
          quantityBefore: inv.quantity,
          quantityAfter: inv.quantity - item.quantity,
          unitCost: product.costPrice,
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
      if (totalAmount < 0) {
        throw new BadRequestException(
          'Giảm giá không thể lớn hơn tổng đơn hàng',
        );
      }
      const paidAmount = dto.payments.reduce((s, p) => s + p.amount, 0);

      // 3. Tạo order
      const order = await tx.order.create({
        data: {
          storeId,
          code,
          customerId: resolvedCustomerId,
          channel: 'pos',
          status: 'completed',
          subtotal,
          discountAmount: orderDiscount,
          discountType: dto.discountType,
          totalAmount,
          paidAmount,
          createdById: userId,
          completedAt: new Date(),
          items: { createMany: { data: orderItems } },
        },
        include: { items: true },
      });

      // 3b. Ghi log inventory transactions với referenceId
      for (const txData of inventoryTransactionData) {
        await tx.inventoryTransaction.create({
          data: {
            storeId: txData.storeId,
            inventoryId: txData.inventoryId,
            productId: txData.productId,
            variantId: txData.variantId,
            type: 'sale',
            quantityChange: txData.quantityChange,
            quantityBefore: txData.quantityBefore,
            quantityAfter: txData.quantityAfter,
            unitCost: txData.unitCost,
            referenceType: 'order',
            referenceId: order.id,
            performedBy: userId,
          },
        });
      }

      // 4. Tạo payments
      for (const p of dto.payments) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            storeId,
            method: p.method,
            amount: p.amount,
            status: 'completed',
            processedById: userId,
          },
        });
      }

      // 5. Cập nhật customer stats
      if (resolvedCustomerId) {
        await tx.customer.update({
          where: { id: resolvedCustomerId },
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

  async cancel(id: string, storeId: string, userId: string, reason?: string) {
    const order = await this.findOne(id, storeId);
    if (order.status === 'cancelled') {
      throw new BadRequestException('Đơn hàng đã bị hủy');
    }

    return this.prisma.$transaction(async (tx) => {
      // Hoàn kho
      for (const item of order.items) {
        await tx.inventory.updateMany({
          where: {
            storeId,
            productId: item.productId,
            variantId: item.variantId ?? null,
          },
          data: { quantity: { increment: item.quantity } },
        });
      }

      // Hoàn customer stats
      if (order.customerId) {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalOrders: { decrement: 1 },
            totalSpent: { decrement: order.totalAmount },
          },
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

  async complete(id: string, storeId: string) {
    await this.findOne(id, storeId);
    return this.prisma.order.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() },
    });
  }
}
