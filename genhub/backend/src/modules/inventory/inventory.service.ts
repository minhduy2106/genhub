import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(storeId: string, query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [data, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where: { storeId },
        include: { product: true, variant: true },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventory.count({ where: { storeId } }),
    ]);
    return paginate(data, total, page, limit);
  }

  async lowStock(storeId: string) {
    return this.getLowStockItems(storeId);
  }

  async getLowStockItems(storeId: string) {
    const items = await this.prisma.$queryRaw`
      SELECT i.*, p.name as product_name, p.sku
      FROM inventory i
      JOIN products p ON p.id = i."productId"
      WHERE i."storeId" = ${storeId}
        AND i.quantity <= i."lowStockAlert"
        AND p."deletedAt" IS NULL
    `;
    return items;
  }

  async purchase(
    storeId: string,
    userId: string,
    items: {
      productId: string;
      variantId?: string;
      quantity: number;
      unitCost: number;
    }[],
    supplierId?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inv = await tx.inventory.findFirst({
          where: {
            storeId,
            productId: item.productId,
            variantId: item.variantId ?? null,
          },
        });
        if (!inv) throw new BadRequestException('Không tìm thấy tồn kho');

        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            quantity: { increment: item.quantity },
            version: { increment: 1 },
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            storeId,
            inventoryId: inv.id,
            productId: item.productId,
            variantId: item.variantId,
            type: 'purchase',
            quantityChange: item.quantity,
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

  async adjustment(
    storeId: string,
    userId: string,
    productId: string,
    variantId: string | undefined,
    newQuantity: number,
    notes?: string,
  ) {
    const inv = await this.prisma.inventory.findFirst({
      where: { storeId, productId, variantId: variantId ?? null },
    });
    if (!inv) throw new BadRequestException('Không tìm thấy tồn kho');

    if (newQuantity < 0) {
      throw new BadRequestException('Số lượng tồn kho không thể âm');
    }

    const change = newQuantity - inv.quantity;
    const type = change >= 0 ? 'adjustment_in' : 'adjustment_out';

    await this.prisma.inventory.update({
      where: { id: inv.id },
      data: { quantity: newQuantity, version: { increment: 1 } },
    });

    await this.prisma.inventoryTransaction.create({
      data: {
        storeId,
        inventoryId: inv.id,
        productId,
        variantId,
        type,
        quantityChange: change,
        quantityBefore: inv.quantity,
        quantityAfter: newQuantity,
        notes,
        performedBy: userId,
      },
    });
    return { message: 'Điều chỉnh tồn kho thành công' };
  }

  async transactions(storeId: string, query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [data, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where: { storeId },
        include: {
          product: true,
          variant: true,
          performer: { select: { fullName: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inventoryTransaction.count({ where: { storeId } }),
    ]);
    return paginate(data, total, page, limit);
  }
}
