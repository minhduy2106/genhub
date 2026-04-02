import { PaginationDto } from '../../../common/dto/pagination.dto';
export declare class ProductQueryDto extends PaginationDto {
    search?: string;
    categoryId?: string;
    status?: string;
    lowStock?: boolean;
}
