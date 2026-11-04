import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProjectDto } from './dto';
import { ProjectsService } from './projects.service';

@Controller('api/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Req() req: { user: AuthPayload }) {
    return this.projects.list(req.user);
  }

  @Post()
  create(@Req() req: { user: AuthPayload }, @Body() dto: CreateProjectDto) {
    return this.projects.create(req.user, dto);
  }
}
