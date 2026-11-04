import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { ProjectsService } from './projects.service';

@Controller('api/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Req() req: { user: AuthPayload }) {
    return this.projects.list(req.user);
  }

  @Get(':id')
  get(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.projects.get(req.user, id);
  }

  @Post()
  create(@Req() req: { user: AuthPayload }, @Body() dto: CreateProjectDto) {
    return this.projects.create(req.user, dto);
  }

  @Put(':id')
  update(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(req.user, id, dto);
  }
}
