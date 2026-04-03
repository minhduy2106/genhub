import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(storeId: string, query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { storeId, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async create(
    storeId: string,
    data: {
      name: string;
      phone?: string;
      email?: string;
      address?: string;
      contactPerson?: string;
    },
  ) {
    return this.prisma.supplier.create({ data: { ...data, storeId } });
  }

  async findOne(id: string, storeId: string) {
    const s = await this.prisma.supplier.findFirst({
      where: { id, storeId, deletedAt: null },
    });
    if (!s) throw new NotFoundException('Không tìm thấy nhà cung cấp');
    return s;
  }

  async update(id: string, storeId: string, data: Prisma.SupplierUpdateInput) {
    await this.findOne(id, storeId);
    return this.prisma.supplier.update({ where: { id }, data });
  }

  async remove(id: string, storeId: string) {
    await this.findOne(id, storeId);
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
