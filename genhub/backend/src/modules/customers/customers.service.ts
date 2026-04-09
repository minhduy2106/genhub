import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/dto/pagination.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  private async ensureUniqueCustomerFields(
    storeId: string,
    data: {
      phone?: string;
      code?: string;
    },
    excludeId?: string,
  ) {
    if (data.phone) {
      const existingPhone = await this.prisma.customer.findFirst({
        where: {
          storeId,
          phone: data.phone,
          deletedAt: null,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });
      if (existingPhone) {
        throw new ConflictException(
          'Số điện thoại khách hàng đã tồn tại trong cửa hàng',
        );
      }
    }

    if (data.code) {
      const existingCode = await this.prisma.customer.findFirst({
        where: {
          storeId,
          code: data.code,
          deletedAt: null,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });
      if (existingCode) {
        throw new ConflictException('Mã khách hàng đã tồn tại trong cửa hàng');
      }
    }
  }

  async findAll(storeId: string, query: CustomerQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CustomerWhereInput = {
      storeId,
      deletedAt: null,
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
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);
    return paginate(data, total, page, limit);
  }

  async create(
    storeId: string,
    data: {
      fullName: string;
      phone?: string;
      email?: string;
      address?: string;
      code?: string;
    },
  ) {
    await this.ensureUniqueCustomerFields(storeId, {
      phone: data.phone,
      code: data.code,
    });

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

  async update(
    id: string,
    storeId: string,
    data: {
      fullName?: string;
      phone?: string;
      email?: string;
      address?: string;
      notes?: string;
      isActive?: boolean;
    },
  ) {
    await this.findOne(id, storeId);
    await this.ensureUniqueCustomerFields(
      storeId,
      {
        phone: data.phone,
      },
      id,
    );
    return this.prisma.customer.update({ where: { id }, data });
  }

  async remove(id: string, storeId: string) {
    await this.findOne(id, storeId);
    return this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
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
        storeId,
        deletedAt: null,
        OR: [
          { fullName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      },
      take: 10,
    });
  }
}
