import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { jwtConstants } from "./jwt-constants";
import { JwtAdminGuard } from "./guards/jwt-auth.guard";

@Module({
    imports:[
        JwtModule.register({
            global: true,
            secret: jwtConstants.secret,
            signOptions: { expiresIn: '2h' },
          })
    ],
    providers:[JwtAdminGuard]
})

export class AuthModule{}