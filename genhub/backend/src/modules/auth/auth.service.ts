import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { createSlug } from '../../common/utils/slug.util';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redis: RedisService,
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

    // Return tokens + user info (same format as login)
    const tokens = this.generateTokens(
      result.user.id,
      result.store.id,
      'owner',
    );

    return {
      ...tokens,
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        role: 'owner',
        permissions: [],
        store: {
          id: result.store.id,
          name: result.store.name,
          plan: result.store.plan,
        },
      },
    };
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

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null, isActive: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'Nếu email tồn tại, mã xác nhận đã được gửi' };
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis with 15 minute expiry
    const redisKey = `password_reset:${email}`;
    await this.redis.set(redisKey, code, 15 * 60);

    // In production, send email here. For now, log to console.
    console.log(`[Forgot Password] OTP for ${email}: ${code}`);

    return { message: 'Mã xác nhận đã được gửi đến email của bạn' };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    const redisKey = `password_reset:${email}`;
    const storedCode = await this.redis.get(redisKey);

    if (!storedCode || storedCode !== code) {
      throw new BadRequestException('Mã xác nhận không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Delete the OTP from Redis after successful reset
    await this.redis.del(redisKey);

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string; type: string }>(
        token,
      );

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token không hợp lệ');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          role: {
            include: { permissions: { include: { permission: true } } },
          },
          store: true,
        },
      });

      if (!user || !user.isActive || user.deletedAt) {
        throw new UnauthorizedException(
          'Người dùng không tồn tại hoặc đã bị vô hiệu hóa',
        );
      }

      const permissions = user.role.permissions.map((rp) => rp.permission.slug);
      const accessToken = this.jwtService.sign(
        {
          sub: user.id,
          storeId: user.storeId,
          role: user.role.slug,
          permissions,
          fullName: user.fullName,
        } as JwtPayload,
        { expiresIn: '15m' },
      );

      return { accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
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
