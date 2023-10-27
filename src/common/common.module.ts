import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { LoggerService } from './logger/logger.service';

@Module({
    imports:[
        AuthModule
    ],
    providers:[LoggerService],
    exports:[LoggerService]
})
export class CommonModule {}
