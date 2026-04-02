import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
export declare class CategoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(storeId: string): Promise<({
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
    create(storeId: string, dto: CreateCategoryDto): Promise<{
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
    findOne(id: string, storeId: string): Promise<{
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
    update(id: string, storeId: string, dto: Partial<CreateCategoryDto>): Promise<{
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
    remove(id: string, storeId: string): Promise<{
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
