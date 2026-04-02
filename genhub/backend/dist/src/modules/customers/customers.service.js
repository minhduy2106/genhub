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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const pagination_dto_1 = require("../../common/dto/pagination.dto");
let CustomersService = class CustomersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(storeId, query) {
        const where = {
            storeId, deletedAt: null,
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
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.customer.count({ where }),
        ]);
        return (0, pagination_dto_1.paginate)(data, total, query.page, query.limit);
    }
    async create(storeId, data) {
        return this.prisma.customer.create({
            data: { ...data, storeId },
        });
    }
    async findOne(id, storeId) {
        const customer = await this.prisma.customer.findFirst({
            where: { id, storeId, deletedAt: null },
        });
        if (!customer)
            throw new common_1.NotFoundException('Không tìm thấy khách hàng');
        return customer;
    }
    async update(id, storeId, data) {
        await this.findOne(id, storeId);
        return this.prisma.customer.update({ where: { id }, data });
    }
    async remove(id, storeId) {
        await this.findOne(id, storeId);
        return this.prisma.customer.update({
            where: { id }, data: { deletedAt: new Date() },
        });
    }
    async getOrders(id, storeId) {
        await this.findOne(id, storeId);
        return this.prisma.order.findMany({
            where: { customerId: id, storeId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
    async search(storeId, q) {
        return this.prisma.customer.findMany({
            where: {
                storeId, deletedAt: null,
                OR: [
                    { fullName: { contains: q, mode: 'insensitive' } },
                    { phone: { contains: q } },
                ],
            },
            take: 10,
        });
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CustomersService);
//# sourceMappingURL=customers.service.js.map