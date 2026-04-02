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
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const slug_util_1 = require("../../common/utils/slug.util");
let CategoriesService = class CategoriesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(storeId) {
        const categories = await this.prisma.category.findMany({
            where: { storeId },
            include: { children: true, _count: { select: { products: true } } },
            orderBy: { sortOrder: 'asc' },
        });
        return categories.filter((c) => !c.parentId);
    }
    async create(storeId, dto) {
        const slug = (0, slug_util_1.createSlug)(dto.name) + '-' + Date.now();
        return this.prisma.category.create({
            data: { ...dto, storeId, slug },
        });
    }
    async findOne(id, storeId) {
        const cat = await this.prisma.category.findFirst({
            where: { id, storeId },
            include: { children: true },
        });
        if (!cat)
            throw new common_1.NotFoundException('Không tìm thấy danh mục');
        return cat;
    }
    async update(id, storeId, dto) {
        await this.findOne(id, storeId);
        return this.prisma.category.update({ where: { id }, data: dto });
    }
    async remove(id, storeId) {
        await this.findOne(id, storeId);
        return this.prisma.category.delete({ where: { id } });
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map