import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private service: CategoriesService) {}

  @Get()
  @RequirePermissions('products:view')
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.storeId);
  }

  @Post()
  @RequirePermissions('products:create')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCategoryDto) {
    return this.service.create(user.storeId, dto);
  }

  @Get(':id')
  @RequirePermissions('products:view')
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.storeId);
  }

  @Patch(':id')
  @RequirePermissions('products:update')
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return this.service.update(id, user.storeId, dto);
  }

  @Delete(':id')
  @RequirePermissions('products:delete')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.storeId);
  }
}
