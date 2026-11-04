import { Controller, Get, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('api/public/reports')
export class PublicReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get(':token')
  show(@Param('token') token: string) {
    return this.reports.getPublicReport(token);
  }
}
