import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsArray,
  ArrayMinSize,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PosOrderItemDto {
  @IsUUID() productId: string;
  @IsOptional() @IsUUID() variantId?: string;
  @IsInt() @Min(1) quantity: number;
  @IsNumber() @Min(0) unitPrice: number;
  @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
}

export class PosPaymentDto {
  @IsString() @IsNotEmpty() method: string;
  @IsNumber() @Min(0) amount: number;
}

export class CreatePosOrderDto {
  @IsOptional() @IsUUID() customerId?: string;

  @IsOptional() @IsNotEmpty() @IsString() customerName?: string;
  @IsOptional() @IsNotEmpty() @IsString() customerPhone?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 sản phẩm' })
  @ValidateNested({ each: true })
  @Type(() => PosOrderItemDto)
  items: PosOrderItemDto[];

  @IsArray()
  @ArrayMinSize(1, { message: 'Cần có ít nhất 1 phương thức thanh toán' })
  @ValidateNested({ each: true })
  @Type(() => PosPaymentDto)
  payments: PosPaymentDto[];

  @IsOptional() @IsNumber() @Min(0) discountAmount?: number;
  @IsOptional() @IsString() discountType?: string;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() customerNote?: string;
}
