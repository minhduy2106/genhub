import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('dashboard')
  @RequirePermissions('reports:view')
  dashboard(@CurrentUser() user: JwtPayload) {
    return this.service.dashboard(user.storeId);
  }

  @Get('revenue')
  @RequirePermissions('reports:view')
  revenue(
    @CurrentUser() user: JwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.service.revenue(user.storeId, from, to);
  }

  @Get('products')
  @RequirePermissions('reports:view')
  topProducts(@CurrentUser() user: JwtPayload, @Query('limit') limit?: number) {
    return this.service.topProducts(user.storeId, limit ?? 10);
  }
}
