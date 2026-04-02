export declare class PaginationDto {
    page: number;
    limit: number;
    sort?: string;
    order?: 'asc' | 'desc';
}
export interface PaginatedResult<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare function paginate<T>(data: T[], total: number, page: number, limit: number): PaginatedResult<T>;
