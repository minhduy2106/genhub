import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  async findAll(storeId: string, query: PaginationDto) {
    const where = { storeId, deletedAt: null as null };
    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where, skip: (query.page - 1) * query.limit, take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async create(storeId: string, data: { name: string; phone?: string; email?: string; address?: string; contactPerson?: string }) {
    return this.prisma.supplier.create({ data: { ...data, storeId } });
  }

  async findOne(id: string, storeId: string) {
    const s = await this.prisma.supplier.findFirst({ where: { id, storeId, deletedAt: null } });
    if (!s) throw new NotFoundException('Không tìm thấy nhà cung cấp');
    return s;
  }

  async update(id: string, storeId: string, data: Record<string, unknown>) {
    await this.findOne(id, storeId);
    return this.prisma.supplier.update({ where: { id }, data: data as any });
  }

  async remove(id: string, storeId: string) {
    await this.findOne(id, storeId);
    return this.prisma.supplier.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}
