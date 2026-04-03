import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { createSlug } from '../../common/utils/slug.util';
import { paginate } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(storeId: string, query: ProductQueryDto) {
    const where: Prisma.ProductWhereInput = {
      storeId,
      deletedAt: null,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { sku: { contains: query.search, mode: 'insensitive' } },
          { barcode: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.status && { status: query.status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          variants: true,
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          inventory: true,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async create(storeId: string, userId: string, dto: CreateProductDto) {
    const slug = createSlug(dto.name) + '-' + Date.now();

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          storeId,
          categoryId: dto.categoryId,
          name: dto.name,
          slug,
          description: dto.description,
          sku: dto.sku,
          barcode: dto.barcode,
          unit: dto.unit,
          hasVariants: dto.hasVariants ?? false,
          price: dto.price,
          costPrice: dto.costPrice,
          comparePrice: dto.comparePrice,
          status: dto.status ?? 'active',
          isPosVisible: dto.isPosVisible ?? true,
          tags: dto.tags ?? [],
          attributes: (dto.attributes ?? {}) as Prisma.InputJsonValue,
          createdBy: userId,
        },
      });

      // Tạo inventory cho sản phẩm không có biến thể
      if (!dto.hasVariants) {
        await tx.inventory.create({
          data: {
            storeId,
            productId: product.id,
            quantity: dto.initialQuantity ?? 0,
            lowStockAlert: dto.lowStockAlert ?? 5,
          },
        });
      }

      // Tạo variants nếu có
      if (dto.variants?.length) {
        for (const v of dto.variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              storeId,
              name: v.name,
              sku: v.sku,
              barcode: v.barcode,
              price: v.price,
              costPrice: v.costPrice,
              attributes: v.attributes ?? {},
            },
          });
          await tx.inventory.create({
            data: {
              storeId,
              productId: product.id,
              variantId: variant.id,
              quantity: v.initialQuantity ?? 0,
              lowStockAlert: dto.lowStockAlert ?? 5,
            },
          });
        }
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: { variants: true, inventory: true, images: true },
      });
    });
  }

  async findOne(id: string, storeId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, storeId, deletedAt: null },
      include: {
        category: true,
        variants: true,
        images: { orderBy: { sortOrder: 'asc' } },
        inventory: true,
      },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }

  async update(id: string, storeId: string, dto: Partial<CreateProductDto>) {
    await this.findOne(id, storeId);
    const {
      variants: _variants,
      initialQuantity: _initialQuantity,
      lowStockAlert: _lowStockAlert,
      categoryId,
      attributes,
      ...rest
    } = dto;
    return this.prisma.product.update({
      where: { id },
      data: {
        ...rest,
        ...(categoryId !== undefined && {
          category: categoryId
            ? { connect: { id: categoryId } }
            : { disconnect: true },
        }),
        ...(attributes !== undefined && {
          attributes: attributes as Prisma.InputJsonValue,
        }),
      },
      include: { variants: true, inventory: true },
    });
  }

  async remove(id: string, storeId: string) {
    await this.findOne(id, storeId);
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async search(storeId: string, q: string) {
    return this.prisma.product.findMany({
      where: {
        storeId,
        deletedAt: null,
        isPosVisible: true,
        status: 'active',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
          { barcode: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: { variants: true, inventory: true, images: { take: 1 } },
      take: 20,
    });
  }

  async findByBarcode(storeId: string, barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: { storeId, barcode, deletedAt: null },
      include: { variants: true, inventory: true },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }
}
