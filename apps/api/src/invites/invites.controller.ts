import { Body, Controller, Get, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { AuthPayload } from '../auth/auth.types';
import { RegisterByInviteDto } from '../auth/dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateInviteDto } from './dto';
import { InvitesService } from './invites.service';

@Controller()
export class InvitesController {
  constructor(
    private readonly invites: InvitesService,
    private readonly auth: AuthService,
  ) {}

  @Post('api/invites')
  @UseGuards(JwtAuthGuard)
  create(@Req() req: { user: AuthPayload }, @Body() dto: CreateInviteDto) {
    return this.invites.create(req.user, dto);
  }

  @Get('api/invites/validate')
  validate(@Query('token') token = '') {
    return this.invites.validate(token);
  }

  @Post('api/auth/register-by-invite')
  async register(@Body() dto: RegisterByInviteDto, @Res({ passthrough: true }) res: Response) {
    const session = await this.invites.register(dto);
    this.auth.setAuthCookie(res, session.accessToken);
    return session;
  }
}
