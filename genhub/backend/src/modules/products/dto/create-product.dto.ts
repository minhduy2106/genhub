import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariantDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() barcode?: string;
  @IsNumber() @Min(0) price: number;
  @IsOptional() @IsNumber() costPrice?: number;
  @IsOptional() attributes?: Record<string, string>;
  @IsOptional() @IsInt() @Min(0) initialQuantity?: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên sản phẩm không được để trống' })
  name: string;

  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() barcode?: string;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() @IsBoolean() hasVariants?: boolean;
  @IsOptional() @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsNumber() @Min(0) costPrice?: number;
  @IsOptional() @IsNumber() @Min(0) comparePrice?: number;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsBoolean() isPosVisible?: boolean;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() attributes?: Record<string, unknown>;
  @IsOptional() @IsInt() @Min(0) initialQuantity?: number;
  @IsOptional() @IsInt() @Min(0) lowStockAlert?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
