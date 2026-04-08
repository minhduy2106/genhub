import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PurchaseDto } from './dto/purchase.dto';
import { AdjustmentDto } from './dto/adjustment.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('inventory')
export class InventoryController {
  constructor(private service: InventoryService) {}

  @Get()
  @RequirePermissions('inventory:view')
  findAll(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.service.findAll(user.storeId, query);
  }

  @Get('low-stock')
  @RequirePermissions('inventory:view')
  lowStock(@CurrentUser() user: JwtPayload) {
    return this.service.getLowStockItems(user.storeId);
  }

  @Post('purchase')
  @RequirePermissions('inventory:purchase')
  purchase(@CurrentUser() user: JwtPayload, @Body() dto: PurchaseDto) {
    return this.service.purchase(
      user.storeId,
      user.sub,
      dto.items,
      dto.supplierId,
    );
  }

  @Post('adjustment')
  @RequirePermissions('inventory:adjust')
  adjustment(@CurrentUser() user: JwtPayload, @Body() dto: AdjustmentDto) {
    return this.service.adjustment(
      user.storeId,
      user.sub,
      dto.productId,
      dto.variantId,
      dto.newQuantity,
      dto.notes,
    );
  }

  @Get('transactions')
  @RequirePermissions('inventory:view')
  transactions(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.service.transactions(user.storeId, query);
  }
}
