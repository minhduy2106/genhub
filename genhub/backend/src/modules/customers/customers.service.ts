import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto, paginate } from '../../common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(storeId: string, query: PaginationDto & { search?: string }) {
    const where: Prisma.CustomerWhereInput = {
      storeId, deletedAt: null,
      ...(query.search && {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { phone: { contains: query.search } },
          { code: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);
    return paginate(data, total, query.page, query.limit);
  }

  async create(storeId: string, data: { fullName: string; phone?: string; email?: string; address?: string; code?: string }) {
    return this.prisma.customer.create({
      data: { ...data, storeId },
    });
  }

  async findOne(id: string, storeId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, storeId, deletedAt: null },
    });
    if (!customer) throw new NotFoundException('Không tìm thấy khách hàng');
    return customer;
  }

  async update(id: string, storeId: string, data: Prisma.CustomerUpdateInput) {
    await this.findOne(id, storeId);
    return this.prisma.customer.update({ where: { id }, data });
  }

  async remove(id: string, storeId: string) {
    await this.findOne(id, storeId);
    return this.prisma.customer.update({
      where: { id }, data: { deletedAt: new Date() },
    });
  }

  async getOrders(id: string, storeId: string) {
    await this.findOne(id, storeId);
    return this.prisma.order.findMany({
      where: { customerId: id, storeId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async search(storeId: string, q: string) {
    return this.prisma.customer.findMany({
      where: {
        storeId, deletedAt: null,
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      },
      take: 10,
    });
  }
}
