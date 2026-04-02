import { PrismaService } from '../../prisma/prisma.service';
export declare class ReportsService {
    private prisma;
    constructor(prisma: PrismaService);
    dashboard(storeId: string): Promise<{
        revenue: {
            total: number | import("@prisma/client-runtime-utils").Decimal;
        };
        orders: {
            total: number;
        };
        newCustomers: {
            total: number;
        };
        lowStockCount: number;
        revenueChart: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.OrderGroupByOutputType, "createdAt"[]> & {
            _sum: {
                totalAmount: import("@prisma/client-runtime-utils").Decimal | null;
            };
        })[];
        topProducts: (import("@prisma/client").Prisma.PickEnumerable<import("@prisma/client").Prisma.OrderItemGroupByOutputType, "productId"[]> & {
            _sum: {
                quantity: number | null;
                lineTotal: import("@prisma/client-runtime-utils").Decimal | null;
            };
        })[];
    }>;
    revenue(storeId: string, from?: string, to?: string): Promise<{
        total: number;
        orders: {
            createdAt: Date;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
        }[];
    }>;
    topProducts(storeId: string, limit?: number): Promise<{
        product: {
            id: string;
            name: string;
            sku: string | null;
        } | undefined;
        productId: string;
        _sum: {
            quantity: number | null;
            lineTotal: import("@prisma/client-runtime-utils").Decimal | null;
        };
    }[]>;
}
