import { ReportsService } from './reports.service';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class ReportsController {
    private service;
    constructor(service: ReportsService);
    dashboard(user: JwtPayload): Promise<{
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
    revenue(user: JwtPayload, from?: string, to?: string): Promise<{
        total: number;
        orders: {
            createdAt: Date;
            totalAmount: import("@prisma/client-runtime-utils").Decimal;
        }[];
    }>;
    topProducts(user: JwtPayload, limit?: number): Promise<{
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
