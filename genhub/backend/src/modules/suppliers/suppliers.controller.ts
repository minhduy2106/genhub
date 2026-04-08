import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('suppliers')
export class SuppliersController {
  constructor(private service: SuppliersService) {}

  @Get()
  @RequirePermissions('suppliers:view')
  findAll(@CurrentUser() user: JwtPayload, @Query() query: PaginationDto) {
    return this.service.findAll(user.storeId, query);
  }

  @Post()
  @RequirePermissions('suppliers:create')
  create(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: { name: string; phone?: string; email?: string; address?: string },
  ) {
    return this.service.create(user.storeId, body);
  }

  @Get(':id')
  @RequirePermissions('suppliers:view')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.storeId);
  }

  @Patch(':id')
  @RequirePermissions('suppliers:update')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      name?: string;
      contactName?: string;
      phone?: string;
      email?: string;
      address?: string;
      taxCode?: string;
      notes?: string;
      isActive?: boolean;
    },
  ) {
    return this.service.update(id, user.storeId, body);
  }

  @Delete(':id')
  @RequirePermissions('suppliers:delete')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.storeId);
  }
}
