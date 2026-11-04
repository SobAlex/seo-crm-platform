import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { ImportQueriesDto, UpdateSourceDto } from './dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('api/projects/:id/analytics/dashboard')
  dashboard(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Query('month') month?: string) {
    return this.analytics.getProjectDashboard(req.user, id, month);
  }

  @Get('api/projects/:id/analytics/marker-queries')
  markerQueries(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.analytics.getMarkerQueries(req.user, id);
  }

  @Post('api/projects/:id/queries/import')
  importQueries(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: ImportQueriesDto) {
    return this.analytics.importQueries(req.user, id, dto.rawText);
  }

  @Get('api/projects/:id/source')
  getSource(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.analytics.getSource(req.user, id);
  }

  @Put('api/projects/:id/source')
  updateSource(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: UpdateSourceDto) {
    return this.analytics.updateSource(req.user, id, dto);
  }
}
