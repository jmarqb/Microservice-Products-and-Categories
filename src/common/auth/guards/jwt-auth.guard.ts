import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAdminGuard implements CanActivate {

    constructor(
        private readonly jwtService: JwtService
    ) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers['authorization'];

        if (!authHeader) {
            throw new UnauthorizedException('Access unauthorized');
        }

        const token = authHeader.split(' ')[1];
        try {
            const decodedToken = this.jwtService.verify(token);
            
            if(decodedToken.id){
                request.userId = decodedToken.id;
            }

            if (!decodedToken.roles || !decodedToken.roles.includes('admin')) {
                throw new ForbiddenException('Access forbidden');
            }

            return true;
        } catch (err) {
            console.log(err);
            throw new UnauthorizedException('Access unauthorized');
        }
    }
}
