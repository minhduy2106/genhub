import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { createSlug } from '../../common/utils/slug.util';
import { JwtPayload } from '../../common/decorators/current-user.decorator';

const SYSTEM_PERMISSION_DEFINITIONS = [
  {
    module: 'products',
    action: 'view',
    slug: 'products:view',
    description: 'Xem danh sách và chi tiết sản phẩm',
  },
  {
    module: 'products',
    action: 'create',
    slug: 'products:create',
    description: 'Tạo sản phẩm mới',
  },
  {
    module: 'products',
    action: 'update',
    slug: 'products:update',
    description: 'Chỉnh sửa sản phẩm',
  },
  {
    module: 'products',
    action: 'delete',
    slug: 'products:delete',
    description: 'Xóa sản phẩm',
  },
  {
    module: 'inventory',
    action: 'view',
    slug: 'inventory:view',
    description: 'Xem tồn kho',
  },
  {
    module: 'inventory',
    action: 'purchase',
    slug: 'inventory:purchase',
    description: 'Nhập hàng vào kho',
  },
  {
    module: 'inventory',
    action: 'adjust',
    slug: 'inventory:adjust',
    description: 'Điều chỉnh số lượng tồn kho',
  },
  {
    module: 'orders',
    action: 'view',
    slug: 'orders:view',
    description: 'Xem danh sách đơn hàng',
  },
  {
    module: 'orders',
    action: 'create',
    slug: 'orders:create',
    description: 'Tạo đơn hàng bán tại quầy',
  },
  {
    module: 'orders',
    action: 'update',
    slug: 'orders:update',
    description: 'Chỉnh sửa và xác nhận đơn hàng',
  },
  {
    module: 'orders',
    action: 'cancel',
    slug: 'orders:cancel',
    description: 'Hủy đơn hàng',
  },
  {
    module: 'customers',
    action: 'view',
    slug: 'customers:view',
    description: 'Xem khách hàng',
  },
  {
    module: 'customers',
    action: 'create',
    slug: 'customers:create',
    description: 'Tạo khách hàng',
  },
  {
    module: 'customers',
    action: 'update',
    slug: 'customers:update',
    description: 'Chỉnh sửa khách hàng',
  },
  {
    module: 'customers',
    action: 'delete',
    slug: 'customers:delete',
    description: 'Xóa khách hàng',
  },
  {
    module: 'reports',
    action: 'view',
    slug: 'reports:view',
    description: 'Xem báo cáo doanh thu',
  },
  {
    module: 'suppliers',
    action: 'view',
    slug: 'suppliers:view',
    description: 'Xem nhà cung cấp',
  },
  {
    module: 'suppliers',
    action: 'create',
    slug: 'suppliers:create',
    description: 'Tạo nhà cung cấp',
  },
  {
    module: 'suppliers',
    action: 'update',
    slug: 'suppliers:update',
    description: 'Chỉnh sửa nhà cung cấp',
  },
  {
    module: 'suppliers',
    action: 'delete',
    slug: 'suppliers:delete',
    description: 'Xóa nhà cung cấp',
  },
  {
    module: 'shifts',
    action: 'view',
    slug: 'shifts:view',
    description: 'Xem ca làm',
  },
  {
    module: 'shifts',
    action: 'manage',
    slug: 'shifts:manage',
    description: 'Quản lý ca làm',
  },
] as const;

const STAFF_PERMISSION_SLUGS = [
  'products:view',
  'inventory:view',
  'inventory:adjust',
  'orders:view',
  'orders:create',
  'orders:update',
  'orders:cancel',
  'customers:view',
  'customers:create',
] as const;

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;

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
      [],
      dto.fullName,
    );
    await this.persistRefreshToken(result.user.id, tokens.refreshToken);

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
      user.fullName,
    );
    await this.persistRefreshToken(user.id, tokens.refreshToken);

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
    // Rate limit: max 5 OTP requests per email per 15 minutes
    const rateLimitKey = `otp:attempts:${email}`;
    const attempts = await this.redis.get(rateLimitKey);
    if (attempts && parseInt(attempts) >= 5) {
      throw new BadRequestException(
        'Quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút',
      );
    }

    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null, isActive: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'Nếu email tồn tại, mã xác nhận đã được gửi' };
    }

    // Increment attempt counter
    const currentAttempts = attempts ? parseInt(attempts) + 1 : 1;
    await this.redis.set(rateLimitKey, currentAttempts.toString(), 15 * 60);

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in Redis with 15 minute expiry
    const redisKey = `password_reset:${email}`;
    await this.redis.set(redisKey, code, 15 * 60);

    // In production, send email here. For now, log to console (dev only).
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Forgot Password] OTP for ${email}: ${code}`);
    }

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
    await this.revokeAllRefreshTokens(user.id);

    // Delete the OTP from Redis after successful reset
    await this.redis.del(redisKey);

    return { message: 'Đặt lại mật khẩu thành công' };
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, isActive: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });
    await this.revokeAllRefreshTokens(user.id);

    return { message: 'Đổi mật khẩu thành công' };
  }

  async getStore(storeId: string) {
    return this.prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        settings: true,
        plan: true,
      },
    });
  }

  async updateStore(
    user: JwtPayload,
    data: {
      name?: string;
      phone?: string;
      address?: string;
      settings?: Record<string, unknown>;
    },
  ) {
    this.ensureOwner(user);

    const updateData: Prisma.StoreUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.settings !== undefined && {
        settings: data.settings as Prisma.InputJsonValue,
      }),
    };

    const store = await this.prisma.store.update({
      where: { id: user.storeId },
      data: updateData,
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        settings: true,
        plan: true,
      },
    });
    return store;
  }

  async listStaff(user: JwtPayload) {
    this.ensureOwner(user);

    const staff = await this.prisma.user.findMany({
      where: {
        storeId: user.storeId,
        deletedAt: null,
        isOwner: false,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return staff.map((member) => ({
      id: member.id,
      fullName: member.fullName,
      email: member.email,
      phone: member.phone,
      isActive: member.isActive,
      role: member.role.slug,
      permissions: member.role.permissions.map((rp) => rp.permission.slug),
      createdAt: member.createdAt,
      lastLoginAt: member.lastLoginAt,
    }));
  }

  async createStaff(user: JwtPayload, dto: CreateStaffDto) {
    this.ensureOwner(user);

    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedPhone = dto.phone?.trim() || undefined;

    const existingEmail = await this.prisma.user.findFirst({
      where: {
        storeId: user.storeId,
        email: normalizedEmail,
        deletedAt: null,
      },
    });
    if (existingEmail) {
      throw new ConflictException('Email nhân viên đã tồn tại trong cửa hàng');
    }

    if (normalizedPhone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          storeId: user.storeId,
          phone: normalizedPhone,
          deletedAt: null,
        },
      });
      if (existingPhone) {
        throw new ConflictException(
          'Số điện thoại nhân viên đã tồn tại trong cửa hàng',
        );
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const staffRole = await this.ensureStaffRole(tx, user.storeId);

      const createdUser = await tx.user.create({
        data: {
          storeId: user.storeId,
          roleId: staffRole.id,
          fullName: dto.fullName.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash,
          isOwner: false,
          isActive: true,
        },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      return {
        id: createdUser.id,
        fullName: createdUser.fullName,
        email: createdUser.email,
        phone: createdUser.phone,
        isActive: createdUser.isActive,
        role: createdUser.role.slug,
        permissions: createdUser.role.permissions.map(
          (rp) => rp.permission.slug,
        ),
        createdAt: createdUser.createdAt,
      };
    });
  }

  async refreshToken(token: string | null) {
    try {
      if (!token) {
        throw new UnauthorizedException('Refresh token không được để trống');
      }

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

      const tokenHash = this.hashToken(token);
      const tokenRecord = await this.prisma.refreshToken.findFirst({
        where: {
          tokenHash,
          userId: user.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      if (!tokenRecord) {
        throw new UnauthorizedException(
          'Refresh token không hợp lệ hoặc đã bị thu hồi',
        );
      }

      const permissions = user.role.permissions.map((rp) => rp.permission.slug);
      const tokens = this.generateTokens(
        user.id,
        user.storeId,
        user.role.slug,
        permissions,
        user.fullName,
      );

      await this.prisma.$transaction(async (tx) => {
        await tx.refreshToken.update({
          where: { id: tokenRecord.id },
          data: { revokedAt: new Date() },
        });

        await tx.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: this.hashToken(tokens.refreshToken),
            expiresAt: this.getRefreshTokenExpiresAt(),
          },
        });
      });

      return tokens;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
  }

  async logout(token: string | null) {
    try {
      if (!token) {
        return { message: 'Đăng xuất thành công' };
      }

      const payload = this.jwtService.verify<{ sub: string; type: string }>(
        token,
      );

      if (payload.type === 'refresh') {
        await this.revokeRefreshToken(token);
      }
    } catch {
      // Logout is idempotent. We still return success to avoid leaking token state.
    }

    return { message: 'Đăng xuất thành công' };
  }

  private generateTokens(
    userId: string,
    storeId: string,
    role: string,
    permissions: string[] = [],
    fullName: string = '',
  ) {
    const payload: JwtPayload = {
      sub: userId,
      storeId,
      role,
      permissions,
      fullName,
    };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_TTL,
    });
    const refreshToken = this.jwtService.sign(
      { sub: userId, type: 'refresh' },
      { expiresIn: REFRESH_TOKEN_TTL },
    );
    return { accessToken, refreshToken };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private getRefreshTokenExpiresAt() {
    return new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);
  }

  private async persistRefreshToken(
    userId: string,
    refreshToken: string,
    meta?: { deviceInfo?: Prisma.InputJsonValue; ipAddress?: string },
  ) {
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.getRefreshTokenExpiresAt(),
        ...(meta?.deviceInfo !== undefined && { deviceInfo: meta.deviceInfo }),
        ...(meta?.ipAddress && { ipAddress: meta.ipAddress }),
      },
    });
  }

  private async revokeRefreshToken(token: string) {
    await this.prisma.refreshToken.updateMany({
      where: {
        tokenHash: this.hashToken(token),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { revokedAt: new Date() },
    });
  }

  private async revokeAllRefreshTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private ensureOwner(user: JwtPayload) {
    if (user.role !== 'owner') {
      throw new ForbiddenException(
        'Chỉ chủ cửa hàng mới có quyền thực hiện thao tác này',
      );
    }
  }

  private async ensureSystemPermissions(
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    for (const permission of SYSTEM_PERMISSION_DEFINITIONS) {
      await tx.permission.upsert({
        where: { slug: permission.slug },
        update: {
          module: permission.module,
          action: permission.action,
          description: permission.description,
        },
        create: {
          module: permission.module,
          action: permission.action,
          slug: permission.slug,
          description: permission.description,
        },
      });
    }
  }

  private async ensureStaffRole(tx: Prisma.TransactionClient, storeId: string) {
    await this.ensureSystemPermissions(tx);

    let role = await tx.role.findFirst({
      where: { storeId, slug: 'staff' },
    });

    if (!role) {
      role = await tx.role.create({
        data: {
          storeId,
          name: 'Nhân viên bán hàng',
          slug: 'staff',
        },
      });
    }

    const permissions = await tx.permission.findMany({
      where: {
        slug: {
          in: [...STAFF_PERMISSION_SLUGS],
        },
      },
    });

    await tx.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    await tx.rolePermission.createMany({
      data: permissions.map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      })),
      skipDuplicates: true,
    });

    return role;
  }
}
