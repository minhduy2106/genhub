"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
const slug_util_1 = require("../../common/utils/slug.util");
let AuthService = class AuthService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existing = await this.prisma.user.findFirst({
            where: { email: dto.email, deletedAt: null },
        });
        if (existing)
            throw new common_1.ConflictException('Email đã được sử dụng');
        const slug = (0, slug_util_1.createSlug)(dto.storeName) + '-' + Date.now();
        const passwordHash = await bcrypt.hash(dto.password, 10);
        let ownerRole = await this.prisma.role.findFirst({
            where: { slug: 'owner', storeId: null },
        });
        if (!ownerRole) {
            ownerRole = await this.prisma.role.create({
                data: { name: 'Chủ cửa hàng', slug: 'owner', isSystem: true },
            });
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const store = await tx.store.create({
                data: { name: dto.storeName, slug },
            });
            const user = await tx.user.create({
                data: {
                    storeId: store.id,
                    roleId: ownerRole.id,
                    email: dto.email,
                    phone: dto.phone,
                    passwordHash,
                    fullName: dto.fullName,
                    isOwner: true,
                },
            });
            return { store, user };
        });
        return this.generateTokens(result.user.id, result.store.id, 'owner');
    }
    async login(dto) {
        const user = await this.prisma.user.findFirst({
            where: { email: dto.email, deletedAt: null, isActive: true },
            include: { role: { include: { permissions: { include: { permission: true } } } }, store: true },
        });
        if (!user || !user.passwordHash) {
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
        }
        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Email hoặc mật khẩu không đúng');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        const permissions = user.role.permissions.map((rp) => rp.permission.slug);
        const tokens = await this.generateTokens(user.id, user.storeId, user.role.slug, permissions);
        return {
            ...tokens,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                role: user.role.slug,
                permissions,
                store: { id: user.store.id, name: user.store.name, plan: user.store.plan },
            },
        };
    }
    async getMe(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: { include: { permissions: { include: { permission: true } } } },
                store: true,
            },
        });
        if (!user)
            throw new common_1.UnauthorizedException('Người dùng không tồn tại');
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role.slug,
            permissions: user.role.permissions.map((rp) => rp.permission.slug),
            store: { id: user.store.id, name: user.store.name, plan: user.store.plan },
        };
    }
    async generateTokens(userId, storeId, role, permissions = []) {
        const payload = {
            sub: userId, storeId, role, permissions, fullName: '',
        };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign({ sub: userId, type: 'refresh' }, { expiresIn: '30d' });
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map