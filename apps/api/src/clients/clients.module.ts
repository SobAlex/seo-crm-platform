import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { MembersController } from './members.controller';

@Module({
  imports: [AuthModule],
  controllers: [ClientsController, MembersController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
