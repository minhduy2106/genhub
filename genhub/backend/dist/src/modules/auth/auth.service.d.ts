import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            id: string;
            fullName: string;
            email: string | null;
            role: string;
            permissions: string[];
            store: {
                id: string;
                name: string;
                plan: string;
            };
        };
        accessToken: string;
        refreshToken: string;
    }>;
    getMe(userId: string): Promise<{
        id: string;
        fullName: string;
        email: string | null;
        phone: string | null;
        role: string;
        permissions: string[];
        store: {
            id: string;
            name: string;
            plan: string;
        };
    }>;
    private generateTokens;
}
