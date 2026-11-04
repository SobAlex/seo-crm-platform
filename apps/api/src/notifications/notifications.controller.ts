import { Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@Req() req: { user: AuthPayload }) {
    return this.notifications.getUserNotifications(req.user.sub, req.user.companyId);
  }

  @Put(':id/read')
  read(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.notifications.markAsRead(id, req.user.sub, req.user.companyId);
  }

  @Post('read-all')
  readAll(@Req() req: { user: AuthPayload }) {
    return this.notifications.markAllAsRead(req.user.sub, req.user.companyId);
  }
}
