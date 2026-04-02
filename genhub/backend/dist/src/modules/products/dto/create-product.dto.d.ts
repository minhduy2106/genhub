export declare class CreateVariantDto {
    name: string;
    sku?: string;
    barcode?: string;
    price: number;
    costPrice?: number;
    attributes?: Record<string, string>;
    initialQuantity?: number;
}
export declare class CreateProductDto {
    name: string;
    categoryId?: string;
    description?: string;
    sku?: string;
    barcode?: string;
    unit?: string;
    hasVariants?: boolean;
    price?: number;
    costPrice?: number;
    comparePrice?: number;
    status?: string;
    isPosVisible?: boolean;
    tags?: string[];
    attributes?: Record<string, unknown>;
    initialQuantity?: number;
    lowStockAlert?: number;
    variants?: CreateVariantDto[];
}
