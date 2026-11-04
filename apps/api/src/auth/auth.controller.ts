import { Body, Controller, Get, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthPayload } from './auth.types';
import { DevSwitchDto, LoginDto, RegisterCompanyDto, UpdateCompanyDto, UpdateProfileDto } from './dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.login(dto.email, dto.password, dto.remember === true);
    this.auth.setAuthCookie(res, session.accessToken, dto.remember === true);
    return session;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: { user: AuthPayload }) {
    return this.auth.me(req.user);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: { user: AuthPayload }, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(req.user, dto);
  }

  @Put('company')
  @UseGuards(JwtAuthGuard)
  updateCompany(@Req() req: { user: AuthPayload }, @Body() dto: UpdateCompanyDto) {
    return this.auth.updateCompany(req.user, dto);
  }

  @Post('dev-switch-role')
  async devSwitch(@Body() dto: DevSwitchDto, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.devSwitch(dto.role);
    this.auth.setAuthCookie(res, session.accessToken);
    return session;
  }

  @Post('register-company')
  async registerCompany(@Body() dto: RegisterCompanyDto, @Res({ passthrough: true }) res: Response) {
    const session = await this.auth.registerCompany(dto);
    this.auth.setAuthCookie(res, session.accessToken);
    return session;
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.auth.clearAuthCookie(res);
    return { ok: true };
  }
}
