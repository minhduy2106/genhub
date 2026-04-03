import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PosOrderItemDto {
  @IsUUID() productId: string;
  @IsOptional() @IsUUID() variantId?: string;
  @IsInt() @Min(1) quantity: number;
  @IsNumber() unitPrice: number;
  @IsOptional() @IsNumber() discountAmount?: number;
}

export class PosPaymentDto {
  @IsString() @IsNotEmpty() method: string;
  @IsNumber() @Min(0) amount: number;
}

export class CreatePosOrderDto {
  @IsOptional() @IsUUID() customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosOrderItemDto)
  items: PosOrderItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosPaymentDto)
  payments: PosPaymentDto[];

  @IsOptional() @IsNumber() discountAmount?: number;
  @IsOptional() @IsString() discountType?: string;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() customerNote?: string;
  @IsOptional() @IsUUID() shiftId?: string;
}
