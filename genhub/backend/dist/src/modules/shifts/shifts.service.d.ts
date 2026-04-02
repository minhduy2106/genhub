import { PrismaService } from '../../prisma/prisma.service';
export declare class ShiftsService {
    private prisma;
    constructor(prisma: PrismaService);
    open(storeId: string, userId: string, openingCash: number): Promise<{
        id: string;
        storeId: string;
        status: string;
        totalOrders: number;
        notes: string | null;
        openedById: string;
        closedById: string | null;
        openingCash: import("@prisma/client-runtime-utils").Decimal;
        closingCash: import("@prisma/client-runtime-utils").Decimal | null;
        expectedCash: import("@prisma/client-runtime-utils").Decimal | null;
        cashDifference: import("@prisma/client-runtime-utils").Decimal | null;
        totalRevenue: import("@prisma/client-runtime-utils").Decimal;
        openedAt: Date;
        closedAt: Date | null;
    }>;
    close(id: string, storeId: string, userId: string, closingCash: number, notes?: string): Promise<{
        id: string;
        storeId: string;
        status: string;
        totalOrders: number;
        notes: string | null;
        openedById: string;
        closedById: string | null;
        openingCash: import("@prisma/client-runtime-utils").Decimal;
        closingCash: import("@prisma/client-runtime-utils").Decimal | null;
        expectedCash: import("@prisma/client-runtime-utils").Decimal | null;
        cashDifference: import("@prisma/client-runtime-utils").Decimal | null;
        totalRevenue: import("@prisma/client-runtime-utils").Decimal;
        openedAt: Date;
        closedAt: Date | null;
    }>;
    current(storeId: string, userId: string): Promise<{
        id: string;
        storeId: string;
        status: string;
        totalOrders: number;
        notes: string | null;
        openedById: string;
        closedById: string | null;
        openingCash: import("@prisma/client-runtime-utils").Decimal;
        closingCash: import("@prisma/client-runtime-utils").Decimal | null;
        expectedCash: import("@prisma/client-runtime-utils").Decimal | null;
        cashDifference: import("@prisma/client-runtime-utils").Decimal | null;
        totalRevenue: import("@prisma/client-runtime-utils").Decimal;
        openedAt: Date;
        closedAt: Date | null;
    } | null>;
    findAll(storeId: string): Promise<({
        openedBy: {
            fullName: string;
        };
        closedBy: {
            fullName: string;
        } | null;
    } & {
        id: string;
        storeId: string;
        status: string;
        totalOrders: number;
        notes: string | null;
        openedById: string;
        closedById: string | null;
        openingCash: import("@prisma/client-runtime-utils").Decimal;
        closingCash: import("@prisma/client-runtime-utils").Decimal | null;
        expectedCash: import("@prisma/client-runtime-utils").Decimal | null;
        cashDifference: import("@prisma/client-runtime-utils").Decimal | null;
        totalRevenue: import("@prisma/client-runtime-utils").Decimal;
        openedAt: Date;
        closedAt: Date | null;
    })[]>;
}
