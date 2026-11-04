import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GenerateReportDto, SendReportDto, UpdateReportStatusDto } from './dto';
import { ReportsService } from './reports.service';

@Controller('api/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  list(
    @Req() req: { user: AuthPayload },
    @Query('month') month?: string,
    @Query('status') status?: string,
  ) {
    return this.reports.getCompanyReports(req.user.companyId, { month, status });
  }

  @Post('generate')
  generate(@Req() req: { user: AuthPayload }, @Body() dto: GenerateReportDto) {
    return this.reports.generateReport(req.user, dto.projectId, dto.month, dto.summaryText);
  }

  @Put(':id/status')
  status(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: UpdateReportStatusDto) {
    return this.reports.updateStatus(req.user, id, dto.status);
  }

  @Post(':id/send')
  send(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: SendReportDto) {
    return this.reports.sendReport(req.user, id, dto.email);
  }
}
