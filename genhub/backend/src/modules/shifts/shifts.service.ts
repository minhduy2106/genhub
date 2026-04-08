import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

  async open(storeId: string, userId: string, openingCash: number) {
    const existing = await this.prisma.shift.findFirst({
      where: { storeId, openedById: userId, status: 'open' },
    });
    if (existing)
      throw new BadRequestException(
        'Bạn đang có ca mở, vui lòng đóng ca trước',
      );

    return this.prisma.shift.create({
      data: { storeId, openedById: userId, openingCash, status: 'open' },
    });
  }

  async close(
    id: string,
    storeId: string,
    userId: string,
    closingCash: number,
    notes?: string,
  ) {
    const shift = await this.prisma.shift.findFirst({
      where: { id, storeId, status: 'open' },
    });
    if (!shift) throw new NotFoundException('Không tìm thấy ca đang mở');

    // Tính doanh thu trong ca
    const closedAt = new Date();
    const orders = await this.prisma.order.aggregate({
      where: {
        storeId,
        status: 'completed',
        createdAt: { gte: shift.openedAt, lte: closedAt },
      },
      _sum: { totalAmount: true },
      _count: true,
    });

    const totalRevenue = Number(orders._sum.totalAmount ?? 0);
    const expectedCash = Number(shift.openingCash) + totalRevenue;

    return this.prisma.shift.update({
      where: { id },
      data: {
        closedById: userId,
        closingCash,
        expectedCash,
        cashDifference: closingCash - expectedCash,
        totalOrders: orders._count,
        totalRevenue,
        notes,
        closedAt: new Date(),
        status: 'closed',
      },
    });
  }

  async current(storeId: string, userId: string) {
    return this.prisma.shift.findFirst({
      where: { storeId, openedById: userId, status: 'open' },
    });
  }

  async findAll(storeId: string) {
    return this.prisma.shift.findMany({
      where: { storeId },
      include: {
        openedBy: { select: { fullName: true } },
        closedBy: { select: { fullName: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: 50,
    });
  }
}
