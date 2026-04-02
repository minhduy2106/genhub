import { ShiftsService } from './shifts.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class ShiftsController {
    private service;
    constructor(service: ShiftsService);
    open(user: JwtPayload, openingCash: number): Promise<{
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
    close(id: string, user: JwtPayload, body: {
        closingCash: number;
        notes?: string;
    }): Promise<{
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
    current(user: JwtPayload): Promise<{
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
    findAll(user: JwtPayload): Promise<({
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
