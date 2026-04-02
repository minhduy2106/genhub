import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@Controller('suppliers')
export class SuppliersController {
  constructor(private service: SuppliersService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.service.findAll(user.storeId, query);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() body: { name: string; phone?: string; email?: string; address?: string }) {
    return this.service.create(user.storeId, body);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.storeId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() body: Record<string, unknown>) {
    return this.service.update(id, user.storeId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.storeId);
  }
}
