import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreatePosOrderDto } from './dto/create-pos-order.dto';
import { OrderQueryDto } from './dto/order-query.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private service: OrdersService) {}

  @Get()
  @RequirePermissions('orders:view')
  findAll(@CurrentUser() user: JwtPayload, @Query() query: OrderQueryDto) {
    return this.service.findAll(user.storeId, query);
  }

  @Post('pos')
  @RequirePermissions('orders:create')
  createPosOrder(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePosOrderDto,
  ) {
    return this.service.createPosOrder(user.storeId, user.sub, dto);
  }

  @Get(':id')
  @RequirePermissions('orders:view')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.storeId);
  }

  @Patch(':id/cancel')
  @RequirePermissions('orders:cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body('reason') reason?: string,
  ) {
    return this.service.cancel(id, user.storeId, user.sub, reason);
  }

  @Patch(':id/complete')
  @RequirePermissions('orders:update')
  complete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.complete(id, user.storeId);
  }

  @Patch(':id')
  @RequirePermissions('orders:update')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      customerNote?: string;
      internalNote?: string;
    },
  ) {
    return this.service.update(id, user.storeId, body);
  }
}
