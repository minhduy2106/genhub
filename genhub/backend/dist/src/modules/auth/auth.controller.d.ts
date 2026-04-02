import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from '../../common/decorators/current-user.decorator';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
    getMe(user: JwtPayload): Promise<{
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
}
