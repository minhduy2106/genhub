import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AdjustmentDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsInt()
  @Min(0)
  newQuantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
