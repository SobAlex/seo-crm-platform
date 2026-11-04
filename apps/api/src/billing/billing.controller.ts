import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';
import { ChangePlanDto } from './dto';

@Controller('api/billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('current')
  current(@Req() req: { user: AuthPayload }) {
    return this.billing.getCurrent(req.user);
  }

  @Post('change-plan')
  changePlan(@Req() req: { user: AuthPayload }, @Body() dto: ChangePlanDto) {
    return this.billing.changePlan(req.user, dto.plan, dto.periodMonths);
  }
}
