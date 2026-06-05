import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './controllers/roles.controller';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService],
  exports: [RolesService],
})
export class RolesModule {}
