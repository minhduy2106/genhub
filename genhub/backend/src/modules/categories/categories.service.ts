import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { createSlug } from '../../common/utils/slug.util';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(storeId: string) {
    const categories = await this.prisma.category.findMany({
      where: { storeId, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          include: { _count: { select: { products: true } } },
        },
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return categories.filter((c) => !c.parentId);
  }

  async create(storeId: string, dto: CreateCategoryDto) {
    const name = dto.name.trim();
    await this.ensureNameAvailable(storeId, name);
    await this.ensureParentBelongsToStore(storeId, dto.parentId);

    const slug = createSlug(name) + '-' + Date.now();
    return this.prisma.category.create({
      data: {
        storeId,
        name,
        slug,
        parentId: dto.parentId,
        imageUrl: dto.imageUrl?.trim() || undefined,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findOne(id: string, storeId: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id, storeId, isActive: true },
      include: {
        children: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { products: true } },
      },
    });
    if (!cat) throw new NotFoundException('Không tìm thấy danh mục');
    return cat;
  }

  async update(id: string, storeId: string, dto: Partial<CreateCategoryDto>) {
    await this.findOne(id, storeId);

    const nextName = dto.name?.trim();
    if (nextName) {
      await this.ensureNameAvailable(storeId, nextName, id);
    }

    if (dto.parentId !== undefined) {
      await this.ensureParentBelongsToStore(storeId, dto.parentId, id);
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(nextName && { name: nextName }),
        ...(dto.parentId !== undefined && { parentId: dto.parentId || null }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl?.trim() || null }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string, storeId: string) {
    await this.findOne(id, storeId);

    return this.prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { storeId, categoryId: id, deletedAt: null },
        data: { categoryId: null },
      });
      await tx.category.updateMany({
        where: { storeId, parentId: id },
        data: { parentId: null },
      });

      return tx.category.update({
        where: { id },
        data: { isActive: false, parentId: null },
      });
    });
  }

  private async ensureNameAvailable(
    storeId: string,
    name: string,
    ignoreId?: string,
  ) {
    if (!name) {
      throw new BadRequestException('Tên danh mục không được để trống');
    }

    const existing = await this.prisma.category.findFirst({
      where: {
        storeId,
        name,
        isActive: true,
        ...(ignoreId && { id: { not: ignoreId } }),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Danh mục này đã tồn tại trong cửa hàng');
    }
  }

  private async ensureParentBelongsToStore(
    storeId: string,
    parentId?: string | null,
    currentId?: string,
  ) {
    if (!parentId) return;

    if (parentId === currentId) {
      throw new BadRequestException('Danh mục không thể là danh mục cha của chính nó');
    }

    const parent = await this.prisma.category.findFirst({
      where: { id: parentId, storeId, isActive: true },
      select: { id: true },
    });

    if (!parent) {
      throw new BadRequestException('Danh mục cha không tồn tại trong cửa hàng');
    }
  }
}
