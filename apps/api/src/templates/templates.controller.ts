import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoadmapDto, StageDto, TypeDto, WorkDto } from './dto';
import { TemplatesService } from './templates.service';

@Controller('api/templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get('types')
  types(@Req() req: { user: AuthPayload }) {
    return this.templates.types(req.user);
  }

  @Post('types')
  createType(@Req() req: { user: AuthPayload }, @Body() dto: TypeDto) {
    return this.templates.createType(req.user, dto);
  }

  @Put('types/:id')
  updateType(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: TypeDto) {
    return this.templates.updateType(req.user, id, dto);
  }

  @Delete('types/:id')
  deleteType(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.templates.deleteType(req.user, id);
  }

  @Get('roadmaps')
  roadmaps(@Req() req: { user: AuthPayload }) {
    return this.templates.roadmaps(req.user);
  }

  @Post('roadmaps')
  createRoadmap(@Req() req: { user: AuthPayload }, @Body() dto: RoadmapDto) {
    return this.templates.createRoadmap(req.user, dto);
  }

  @Post('roadmaps/:id/duplicate')
  duplicate(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.templates.duplicateRoadmap(req.user, id);
  }

  @Put('roadmaps/:id')
  updateRoadmap(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: RoadmapDto) {
    return this.templates.updateRoadmap(req.user, id, dto);
  }

  @Delete('roadmaps/:id')
  deleteRoadmap(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.templates.deleteRoadmap(req.user, id);
  }

  @Post('roadmaps/:id/stages')
  addStage(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: StageDto) {
    return this.templates.addStage(req.user, id, dto);
  }

  @Delete('stages/:id')
  deleteStage(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.templates.deleteStage(req.user, id);
  }

  @Post('stages/:id/works')
  addWork(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: WorkDto) {
    return this.templates.addWork(req.user, id, dto);
  }

  @Delete('works/:id')
  deleteWork(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.templates.deleteWork(req.user, id);
  }
}
