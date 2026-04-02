import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('customers')
export class CustomersController {
  constructor(private service: CustomersService) {}

  @Get()
  @RequirePermissions('customers:view')
  findAll(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto & { search?: string }) {
    return this.service.findAll(user.storeId, query);
  }

  @Get('search')
  search(@CurrentUser() user: JwtPayload, @Query('q') q: string) {
    return this.service.search(user.storeId, q ?? '');
  }

  @Post()
  @RequirePermissions('customers:create')
  create(@CurrentUser() user: JwtPayload, @Body() body: { fullName: string; phone?: string; email?: string; address?: string }) {
    return this.service.create(user.storeId, body as any);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.storeId);
  }

  @Get(':id/orders')
  getOrders(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.getOrders(id, user.storeId);
  }

  @Patch(':id')
  @RequirePermissions('customers:update')
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.service.update(id, user.storeId, body as any);
  }

  @Delete(':id')
  @RequirePermissions('customers:delete')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.storeId);
  }
}
