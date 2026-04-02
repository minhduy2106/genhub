export interface JwtPayload {
    sub: string;
    storeId: string;
    role: string;
    permissions: string[];
    email?: string;
    fullName: string;
}
export declare const CurrentUser: (...dataOrPipes: (keyof JwtPayload | import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | undefined)[]) => ParameterDecorator;
