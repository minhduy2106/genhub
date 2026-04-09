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
import { join } from 'path';

type CategoryLookupClient = {
  category: {
    findFirst: (args: {
      where: Prisma.CategoryWhereInput;
      select?: { id?: boolean; storeId?: boolean };
    }) => Promise<{ id: string; storeId: string } | null>;
  };
};

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
    mimetype: string;
    size: number;
    buffer: Buffer;
  }) {
    const allowedMimeTypes = new Map<string, string>([
      ['image/jpeg', '.jpg'],
      ['image/jpg', '.jpg'],
      ['image/png', '.png'],
      ['image/webp', '.webp'],
    ]);

    const normalizedMimeType = file.mimetype.toLowerCase();
    if (!allowedMimeTypes.has(normalizedMimeType)) {
      throw new BadRequestException(
        'Ảnh sản phẩm phải là file JPG, PNG hoặc WEBP',
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Ảnh sản phẩm không được vượt quá 5MB');
    }

    const isJpeg =
      file.buffer.length >= 3 &&
      file.buffer[0] === 0xff &&
      file.buffer[1] === 0xd8 &&
      file.buffer[2] === 0xff;
    const isPng =
      file.buffer.length >= 8 &&
      file.buffer[0] === 0x89 &&
      file.buffer[1] === 0x50 &&
      file.buffer[2] === 0x4e &&
      file.buffer[3] === 0x47 &&
      file.buffer[4] === 0x0d &&
      file.buffer[5] === 0x0a &&
      file.buffer[6] === 0x1a &&
      file.buffer[7] === 0x0a;
    const isWebp =
      file.buffer.length >= 12 &&
      file.buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      file.buffer.subarray(8, 12).toString('ascii') === 'WEBP';

    const detectedMimeType = isJpeg
      ? 'image/jpeg'
      : isPng
        ? 'image/png'
        : isWebp
          ? 'image/webp'
          : null;

    if (detectedMimeType !== normalizedMimeType) {
      throw new BadRequestException('Nội dung file ảnh không hợp lệ');
    }

    return allowedMimeTypes.get(normalizedMimeType) ?? '.jpg';
  }

  private async ensureCategoryBelongsToStore(
    client: CategoryLookupClient,
    storeId: string,
    categoryId?: string | null,
  ) {
    if (categoryId === undefined || categoryId === null) return;

    const category = await client.category.findFirst({
      where: { id: categoryId, storeId },
      select: { id: true, storeId: true },
    });

    if (!category) {
      throw new BadRequestException('Danh mục không tồn tại trong cửa hàng');
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
      await this.ensureCategoryBelongsToStore(tx, storeId, dto.categoryId);

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
    await this.ensureCategoryBelongsToStore(this.prisma, storeId, categoryId);

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
    const product = await this.findOne(id, storeId);
    const uploadDir = this.getUploadDir();
    await mkdir(uploadDir, { recursive: true });

    const fileExt = this.ensureImageFile(file);
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
