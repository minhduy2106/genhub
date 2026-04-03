import { Injectable, NotFoundException } from '@nestjs/common';
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
        children: { where: { isActive: true } },
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
    return categories.filter((c) => !c.parentId);
  }

  async create(storeId: string, dto: CreateCategoryDto) {
    const slug = createSlug(dto.name) + '-' + Date.now();
    return this.prisma.category.create({
      data: { ...dto, storeId, slug },
    });
  }

  async findOne(id: string, storeId: string) {
    const cat = await this.prisma.category.findFirst({
      where: { id, storeId, isActive: true },
      include: { children: true },
    });
    if (!cat) throw new NotFoundException('Không tìm thấy danh mục');
    return cat;
  }

  async update(id: string, storeId: string, dto: Partial<CreateCategoryDto>) {
    await this.findOne(id, storeId);
    return this.prisma.category.update({ where: { id }, data: dto });
  }

  async remove(id: string, storeId: string) {
    await this.findOne(id, storeId);
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
