import { Controller, Post, Body, Get, Patch, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import type { Request, Response } from 'express';

const REFRESH_COOKIE_NAME = 'refreshToken';
const LEGACY_ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return null;

  const pairs = cookieHeader.split(';').map((part) => part.trim());
  const match = pairs.find((pair) => pair.startsWith(`${name}=`));
  if (!match) return null;

  return decodeURIComponent(match.slice(name.length + 1));
}

function getRefreshToken(dtoToken: string | undefined, req: Request) {
  return (
    dtoToken ?? getCookieValue(req.headers.cookie, REFRESH_COOKIE_NAME) ?? null
  );
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });

  res.clearCookie(LEGACY_ACCESS_COOKIE_NAME, { path: '/' });
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...payload } = await this.authService.register(dto);
    setRefreshCookie(res, refreshToken);
    return payload;
  }

  @Public()
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...payload } = await this.authService.login(dto);
    setRefreshCookie(res, refreshToken);
    return payload;
  }

  @Public()
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.newPassword);
  }

  @Public()
  @Post('refresh')
  async refreshToken(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = getRefreshToken(dto.refreshToken, req);
    const { refreshToken, ...payload } =
      await this.authService.refreshToken(token);
    setRefreshCookie(res, refreshToken);
    return payload;
  }

  @Public()
  @Post('logout')
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = getRefreshToken(dto.refreshToken, req);
    const result = await this.authService.logout(token);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    res.clearCookie(LEGACY_ACCESS_COOKIE_NAME, { path: '/' });
    return result;
  }

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  @Get('store')
  getStore(@CurrentUser() user: JwtPayload) {
    return this.authService.getStore(user.storeId);
  }

  @Get('staff')
  listStaff(@CurrentUser() user: JwtPayload) {
    return this.authService.listStaff(user);
  }

  @Post('staff')
  createStaff(@CurrentUser() user: JwtPayload, @Body() dto: CreateStaffDto) {
    return this.authService.createStaff(user, dto);
  }

  @Post('change-password')
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.sub,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Patch('store')
  updateStore(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name?: string;
      phone?: string;
      address?: string;
      settings?: Record<string, unknown>;
    },
  ) {
    return this.authService.updateStore(user, body);
  }
}
