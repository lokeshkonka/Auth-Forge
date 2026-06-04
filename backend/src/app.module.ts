import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './database/prisma.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,

    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppModule {
}
