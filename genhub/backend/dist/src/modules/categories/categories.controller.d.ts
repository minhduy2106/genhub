import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class CategoriesController {
    private service;
    constructor(service: CategoriesService);
    findAll(user: JwtPayload): Promise<({
        children: {
            id: string;
            storeId: string;
            name: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            imageUrl: string | null;
            sortOrder: number;
            parentId: string | null;
        }[];
        _count: {
            products: number;
        };
    } & {
        id: string;
        storeId: string;
        name: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string | null;
        sortOrder: number;
        parentId: string | null;
    })[]>;
    create(user: JwtPayload, dto: CreateCategoryDto): Promise<{
        id: string;
        storeId: string;
        name: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string | null;
        sortOrder: number;
        parentId: string | null;
    }>;
    findOne(id: string, user: JwtPayload): Promise<{
        children: {
            id: string;
            storeId: string;
            name: string;
            slug: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            imageUrl: string | null;
            sortOrder: number;
            parentId: string | null;
        }[];
    } & {
        id: string;
        storeId: string;
        name: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string | null;
        sortOrder: number;
        parentId: string | null;
    }>;
    update(id: string, user: JwtPayload, dto: Partial<CreateCategoryDto>): Promise<{
        id: string;
        storeId: string;
        name: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string | null;
        sortOrder: number;
        parentId: string | null;
    }>;
    remove(id: string, user: JwtPayload): Promise<{
        id: string;
        storeId: string;
        name: string;
        slug: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        imageUrl: string | null;
        sortOrder: number;
        parentId: string | null;
    }>;
}
