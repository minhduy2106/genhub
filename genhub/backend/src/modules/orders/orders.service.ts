import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { paginate } from '../../common/dto/pagination.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import { generateOrderCode } from '../../common/utils/generate-code.util';
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
      if (resolvedCustomerId) {
        const customer = await tx.customer.findFirst({
          where: { id: resolvedCustomerId, storeId, deletedAt: null },
        });
        if (!customer) {
          throw new BadRequestException('Khách hàng không tồn tại');
        }
      }

      if (!resolvedCustomerId && dto.customerName && dto.customerPhone) {
        const existing = await tx.customer.findFirst({
          where: { storeId, phone: dto.customerPhone, deletedAt: null },
        });
        if (existing) {
          resolvedCustomerId = existing.id;
        } else {
          const code = `KH${Date.now().toString().slice(-6)}${Math.floor(
            Math.random() * 100,
          )
            .toString()
            .padStart(2, '0')}`;
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

        const variant = item.variantId
          ? await tx.productVariant.findFirst({
              where: {
                id: item.variantId,
                productId: product.id,
                storeId,
                isActive: true,
              },
            })
          : null;

        if (item.variantId && !variant) {
          throw new BadRequestException(
            `Biến thể của sản phẩm "${product.name}" không tồn tại`,
          );
        }

        // Trừ tồn kho (optimistic locking)
        const inv = await tx.inventory.findFirst({
          where: {
            storeId,
            productId: item.productId,
            variantId: item.variantId ?? null,
          },
        });
        if (!inv || inv.quantity <= 0) {
          throw new BadRequestException(
            `Sản phẩm "${product.name}" đã hết hàng`,
          );
        }
        if (inv.quantity < item.quantity) {
          throw new BadRequestException(
            `Sản phẩm "${product.name}" chỉ còn ${inv.quantity} món`,
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

        const rawUnitPrice = variant?.price ?? product.price;
        if (rawUnitPrice === null || rawUnitPrice === undefined) {
          throw new BadRequestException(
            `Sản phẩm "${product.name}" chưa có giá bán`,
          );
        }
        const serverUnitPrice = Number(rawUnitPrice);

        const discount = item.discountAmount ?? 0;
        const lineTotal = serverUnitPrice * item.quantity - discount;
        subtotal += lineTotal;

        orderItems.push({
          productId: item.productId,
          variantId: item.variantId,
          productSnapshot: {
            name: variant ? `${product.name} - ${variant.name}` : product.name,
            sku: variant?.sku ?? product.sku,
          },
          unitPrice: serverUnitPrice,
          unitCost: variant?.costPrice ?? product.costPrice,
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
      if (!dto.payments || dto.payments.length === 0) {
        throw new BadRequestException(
          'Cần có ít nhất một phương thức thanh toán',
        );
      }
      const paidAmount = dto.payments.reduce((s, p) => s + p.amount, 0);
      if (paidAmount < totalAmount) {
        throw new BadRequestException('Số tiền thanh toán không đủ');
      }

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

      const cashPaid = dto.payments
        .filter((payment) => payment.method === 'cash')
        .reduce((sum, payment) => sum + payment.amount, 0);
      const nonCashPaid = paidAmount - cashPaid;
      const cashRequired = Math.max(0, totalAmount - nonCashPaid);
      const changeAmount = Math.max(0, cashPaid - cashRequired);

      return {
        order: { id: order.id, code, totalAmount, status: 'completed' },
        changeAmount,
      };
    });
  }

  async cancel(id: string, storeId: string, userId: string, reason?: string) {
    const order = await this.findOne(id, storeId);
    if (order.status === 'cancelled') {
      throw new BadRequestException('Đơn hàng đã bị hủy');
    }
    if (order.status === 'completed') {
      throw new BadRequestException('Không thể hủy đơn hàng đã hoàn thành');
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
          data: {
            quantity: { increment: item.quantity },
            version: { increment: 1 },
          },
        });
      }

      // Hoàn customer stats
      if (order.customerId) {
        await tx.customer.updateMany({
          where: { id: order.customerId, storeId, totalOrders: { gt: 0 } },
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

  async update(
    id: string,
    storeId: string,
    data: {
      customerNote?: string;
      internalNote?: string;
    },
  ) {
    await this.findOne(id, storeId);

    return this.prisma.order.update({
      where: { id },
      data: {
        ...(data.customerNote !== undefined && {
          customerNote: data.customerNote || null,
        }),
        ...(data.internalNote !== undefined && {
          internalNote: data.internalNote || null,
        }),
      },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    });
  }
}
