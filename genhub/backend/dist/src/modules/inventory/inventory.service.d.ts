import { PrismaService } from '../../prisma/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(storeId: string, query: PaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        product: {
            id: string;
            storeId: string;
            name: string;
            slug: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            sku: string | null;
            barcode: string | null;
            unit: string | null;
            hasVariants: boolean;
            price: import("@prisma/client-runtime-utils").Decimal | null;
            comparePrice: import("@prisma/client-runtime-utils").Decimal | null;
            costPrice: import("@prisma/client-runtime-utils").Decimal | null;
            status: string;
            isPosVisible: boolean;
            tags: string[];
            attributes: import("@prisma/client/runtime/client").JsonValue;
            createdBy: string | null;
            categoryId: string | null;
        };
        variant: {
            id: string;
            storeId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            imageUrl: string | null;
            sortOrder: number;
            sku: string | null;
            barcode: string | null;
            price: import("@prisma/client-runtime-utils").Decimal;
            comparePrice: import("@prisma/client-runtime-utils").Decimal | null;
            costPrice: import("@prisma/client-runtime-utils").Decimal | null;
            attributes: import("@prisma/client/runtime/client").JsonValue;
            productId: string;
        } | null;
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        reservedQuantity: number;
        lowStockAlert: number;
        version: number;
        lastCountedAt: Date | null;
        productId: string;
        variantId: string | null;
    }>>;
    lowStock(storeId: string): Promise<({
        product: {
            id: string;
            storeId: string;
            name: string;
            slug: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            sku: string | null;
            barcode: string | null;
            unit: string | null;
            hasVariants: boolean;
            price: import("@prisma/client-runtime-utils").Decimal | null;
            comparePrice: import("@prisma/client-runtime-utils").Decimal | null;
            costPrice: import("@prisma/client-runtime-utils").Decimal | null;
            status: string;
            isPosVisible: boolean;
            tags: string[];
            attributes: import("@prisma/client/runtime/client").JsonValue;
            createdBy: string | null;
            categoryId: string | null;
        };
        variant: {
            id: string;
            storeId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            imageUrl: string | null;
            sortOrder: number;
            sku: string | null;
            barcode: string | null;
            price: import("@prisma/client-runtime-utils").Decimal;
            comparePrice: import("@prisma/client-runtime-utils").Decimal | null;
            costPrice: import("@prisma/client-runtime-utils").Decimal | null;
            attributes: import("@prisma/client/runtime/client").JsonValue;
            productId: string;
        } | null;
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        updatedAt: Date;
        quantity: number;
        reservedQuantity: number;
        lowStockAlert: number;
        version: number;
        lastCountedAt: Date | null;
        productId: string;
        variantId: string | null;
    })[]>;
    getLowStockItems(storeId: string): Promise<unknown>;
    purchase(storeId: string, userId: string, items: {
        productId: string;
        variantId?: string;
        quantity: number;
        unitCost: number;
    }[], supplierId?: string): Promise<{
        message: string;
    }>;
    adjustment(storeId: string, userId: string, productId: string, variantId: string | undefined, newQuantity: number, notes?: string): Promise<{
        message: string;
    }>;
    transactions(storeId: string, query: PaginationDto): Promise<import("../../common/dto/pagination.dto").PaginatedResult<{
        product: {
            id: string;
            storeId: string;
            name: string;
            slug: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            sku: string | null;
            barcode: string | null;
            unit: string | null;
            hasVariants: boolean;
            price: import("@prisma/client-runtime-utils").Decimal | null;
            comparePrice: import("@prisma/client-runtime-utils").Decimal | null;
            costPrice: import("@prisma/client-runtime-utils").Decimal | null;
            status: string;
            isPosVisible: boolean;
            tags: string[];
            attributes: import("@prisma/client/runtime/client").JsonValue;
            createdBy: string | null;
            categoryId: string | null;
        };
        variant: {
            id: string;
            storeId: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            imageUrl: string | null;
            sortOrder: number;
            sku: string | null;
            barcode: string | null;
            price: import("@prisma/client-runtime-utils").Decimal;
            comparePrice: import("@prisma/client-runtime-utils").Decimal | null;
            costPrice: import("@prisma/client-runtime-utils").Decimal | null;
            attributes: import("@prisma/client/runtime/client").JsonValue;
            productId: string;
        } | null;
        performer: {
            fullName: string;
        } | null;
    } & {
        id: string;
        storeId: string;
        createdAt: Date;
        productId: string;
        variantId: string | null;
        notes: string | null;
        type: string;
        unitCost: import("@prisma/client-runtime-utils").Decimal | null;
        quantityChange: number;
        quantityBefore: number;
        quantityAfter: number;
        referenceType: string | null;
        referenceId: string | null;
        inventoryId: string;
        performedBy: string | null;
    }>>;
}
