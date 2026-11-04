import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PublicReportsController } from './public-reports.controller';
import { ReportsController } from './reports.controller';
import { ReportsQueue } from './reports.queue';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, MailModule, NotificationsModule],
  controllers: [ReportsController, PublicReportsController],
  providers: [ReportsService, ReportsQueue],
})
export class ReportsModule {}
