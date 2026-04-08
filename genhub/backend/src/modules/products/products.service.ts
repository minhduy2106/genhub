import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { createSlug } from '../../common/utils/slug.util';
import { paginate } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private getUploadDir() {
    return join(process.cwd(), 'uploads', 'products');
  }

  private getPublicBaseUrl() {
    const port = process.env.PORT ?? '4000';
    return process.env.BACKEND_PUBLIC_URL ?? `http://localhost:${port}`;
  }

  private withPublicAssetUrl<T extends { images?: Array<{ url: string }> }>(
    product: T,
  ): T {
    if (!product.images?.length) return product;

    return {
      ...product,
      images: product.images.map((image) => ({
        ...image,
        url: /^https?:\/\//i.test(image.url)
          ? image.url
          : `${this.getPublicBaseUrl()}${image.url.startsWith('/') ? '' : '/'}${image.url}`,
      })),
    };
  }

  private ensureImageFile(file: {
    originalname: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
  }) {
    const allowedMimeTypes = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/jpg',
    ]);

    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'Ảnh sản phẩm phải là file JPG, PNG hoặc WEBP',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Ảnh sản phẩm không được vượt quá 5MB');
    }
  }

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

    const [rawData, total] = await Promise.all([
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

    const data = rawData.map((product) => this.withPublicAssetUrl(product));

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

      const created = await tx.product.findUnique({
        where: { id: product.id },
        include: { variants: true, inventory: true, images: true },
      });

      return created ? this.withPublicAssetUrl(created) : created;
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
    return this.withPublicAssetUrl(product);
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
    const products = await this.prisma.product.findMany({
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

    return products.map((product) => this.withPublicAssetUrl(product));
  }

  async findByBarcode(storeId: string, barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: { storeId, barcode, deletedAt: null },
      include: { variants: true, inventory: true },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }

  async attachImage(
    id: string,
    storeId: string,
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    this.ensureImageFile(file);

    const product = await this.findOne(id, storeId);
    const uploadDir = this.getUploadDir();
    await mkdir(uploadDir, { recursive: true });

    const fileExt = extname(file.originalname).toLowerCase() || '.jpg';
    const fileName = `${product.id}-${Date.now()}${fileExt}`;
    const storageKey = `products/${fileName}`;
    const diskPath = join(uploadDir, fileName);
    const publicUrl = `/uploads/${storageKey}`;

    await writeFile(diskPath, file.buffer);

    const existingImageCount = await this.prisma.productImage.count({
      where: { productId: product.id },
    });

    const image = await this.prisma.productImage.create({
      data: {
        productId: product.id,
        url: publicUrl,
        storageKey,
        altText: product.name,
        sortOrder: existingImageCount,
        isPrimary: existingImageCount === 0,
      },
    });

    return image;
  }
}
