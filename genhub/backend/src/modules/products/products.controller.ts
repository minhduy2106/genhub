import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import {
  CurrentUser,
  JwtPayload,
} from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@Controller('products')
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Get()
  @RequirePermissions('products:view')
  findAll(@CurrentUser() user: JwtPayload, @Query() query: ProductQueryDto) {
    return this.service.findAll(user.storeId, query);
  }

  @Post()
  @RequirePermissions('products:create')
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateProductDto) {
    return this.service.create(user.storeId, user.sub, dto);
  }

  @Get('search')
  search(@CurrentUser() user: JwtPayload, @Query('q') q: string) {
    return this.service.search(user.storeId, q ?? '');
  }

  @Get('barcode/:barcode')
  findByBarcode(
    @CurrentUser() user: JwtPayload,
    @Param('barcode') barcode: string,
  ) {
    return this.service.findByBarcode(user.storeId, barcode);
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
    @Body() dto: Partial<CreateProductDto>,
  ) {
    return this.service.update(id, user.storeId, dto);
  }

  @Delete(':id')
  @RequirePermissions('products:delete')
  remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.remove(id, user.storeId);
  }
}
