"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const slug_util_1 = require("../../common/utils/slug.util");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let ProductsService = class ProductsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(storeId, query) {
        const where = {
            storeId,
            deletedAt: null,
            ...(query.search && {
                OR: [
                    { name: { contains: query.search, mode: 'insensitive' } },
                    { sku: { contains: query.search, mode: 'insensitive' } },
                    { barcode: { contains: query.search, mode: 'insensitive' } },
                ],
            }),
            ...(query.categoryId && { categoryId: query.categoryId }),
            ...(query.status && { status: query.status }),
        };
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: {
                    category: true,
                    variants: true,
                    images: { orderBy: { sortOrder: 'asc' }, take: 1 },
                    inventory: true,
                },
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);
        return (0, pagination_dto_1.paginate)(data, total, query.page, query.limit);
    }
    async create(storeId, userId, dto) {
        const slug = (0, slug_util_1.createSlug)(dto.name) + '-' + Date.now();
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    storeId,
                    categoryId: dto.categoryId,
                    name: dto.name,
                    slug,
                    description: dto.description,
                    sku: dto.sku,
                    barcode: dto.barcode,
                    unit: dto.unit,
                    hasVariants: dto.hasVariants ?? false,
                    price: dto.price,
                    costPrice: dto.costPrice,
                    comparePrice: dto.comparePrice,
                    status: dto.status ?? 'active',
                    isPosVisible: dto.isPosVisible ?? true,
                    tags: dto.tags ?? [],
                    attributes: (dto.attributes ?? {}),
                    createdBy: userId,
                },
            });
            if (!dto.hasVariants) {
                await tx.inventory.create({
                    data: {
                        storeId,
                        productId: product.id,
                        quantity: dto.initialQuantity ?? 0,
                        lowStockAlert: dto.lowStockAlert ?? 5,
                    },
                });
            }
            if (dto.variants?.length) {
                for (const v of dto.variants) {
                    const variant = await tx.productVariant.create({
                        data: {
                            productId: product.id,
                            storeId,
                            name: v.name,
                            sku: v.sku,
                            barcode: v.barcode,
                            price: v.price,
                            costPrice: v.costPrice,
                            attributes: v.attributes ?? {},
                        },
                    });
                    await tx.inventory.create({
                        data: {
                            storeId,
                            productId: product.id,
                            variantId: variant.id,
                            quantity: v.initialQuantity ?? 0,
                            lowStockAlert: dto.lowStockAlert ?? 5,
                        },
                    });
                }
            }
            return tx.product.findUnique({
                where: { id: product.id },
                include: { variants: true, inventory: true, images: true },
            });
        });
    }
    async findOne(id, storeId) {
        const product = await this.prisma.product.findFirst({
            where: { id, storeId, deletedAt: null },
            include: {
                category: true,
                variants: true,
                images: { orderBy: { sortOrder: 'asc' } },
                inventory: true,
            },
        });
        if (!product)
            throw new common_1.NotFoundException('Không tìm thấy sản phẩm');
        return product;
    }
    async update(id, storeId, dto) {
        await this.findOne(id, storeId);
        const { variants, initialQuantity, lowStockAlert, categoryId, attributes, ...rest } = dto;
        return this.prisma.product.update({
            where: { id },
            data: {
                ...rest,
                ...(categoryId !== undefined && { category: categoryId ? { connect: { id: categoryId } } : { disconnect: true } }),
                ...(attributes !== undefined && { attributes: attributes }),
            },
            include: { variants: true, inventory: true },
        });
    }
    async remove(id, storeId) {
        await this.findOne(id, storeId);
        return this.prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    async search(storeId, q) {
        return this.prisma.product.findMany({
            where: {
                storeId,
                deletedAt: null,
                isPosVisible: true,
                status: 'active',
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { sku: { contains: q, mode: 'insensitive' } },
                    { barcode: q },
                ],
            },
            include: { variants: true, inventory: true, images: { take: 1 } },
            take: 20,
        });
    }
    async findByBarcode(storeId, barcode) {
        const product = await this.prisma.product.findFirst({
            where: { storeId, barcode, deletedAt: null },
            include: { variants: true, inventory: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Không tìm thấy sản phẩm');
        return product;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map