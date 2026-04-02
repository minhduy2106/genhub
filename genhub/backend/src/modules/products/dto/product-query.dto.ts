import { IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ProductQueryDto extends PaginationDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() lowStock?: boolean;
}
