import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { createSlug } from '../../common/utils/slug.util';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });
    if (existing) throw new ConflictException('Email đã được sử dụng');

    const slug = createSlug(dto.storeName) + '-' + Date.now();
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Tìm hoặc tạo role owner
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

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null, isActive: true },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        store: true,
      },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const permissions = user.role.permissions.map((rp) => rp.permission.slug);
    const tokens = this.generateTokens(
      user.id,
      user.storeId,
      user.role.slug,
      permissions,
    );

    return {
      ...tokens,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role.slug,
        permissions,
        store: {
          id: user.store.id,
          name: user.store.name,
          plan: user.store.plan,
        },
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { permissions: { include: { permission: true } } } },
        store: true,
      },
    });
    if (!user) throw new UnauthorizedException('Người dùng không tồn tại');

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role.slug,
      permissions: user.role.permissions.map((rp) => rp.permission.slug),
      store: {
        id: user.store.id,
        name: user.store.name,
        plan: user.store.plan,
      },
    };
  }

  private generateTokens(
    userId: string,
    storeId: string,
    role: string,
    permissions: string[] = [],
  ) {
    const payload: JwtPayload = {
      sub: userId,
      storeId,
      role,
      permissions,
      fullName: '',
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: '30d' },
    );
    return { accessToken, refreshToken };
  }
}
