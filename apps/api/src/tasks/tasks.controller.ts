import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChangeStatusDto, CreateCommentDto, CreateTaskDto, TransitionTaskDto, UpdateTaskDto } from './dto';
import { TasksService } from './tasks.service';

@Controller('api/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(@Req() req: { user: AuthPayload }) {
    return this.tasks.list(req.user);
  }

  @Post()
  create(@Req() req: { user: AuthPayload }, @Body() dto: CreateTaskDto) {
    return this.tasks.create(req.user, dto);
  }

  @Get(':id')
  get(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.tasks.get(req.user, id);
  }

  @Put(':id')
  update(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasks.update(req.user, id, dto);
  }

  @Put(':id/status')
  status(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: ChangeStatusDto) {
    return this.tasks.transition(req.user, id, dto.action, dto.reason);
  }

  @Post(':id/comments')
  comment(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: CreateCommentDto) {
    return this.tasks.comment(req.user, id, dto);
  }

  @Post(':id/transition')
  transition(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: TransitionTaskDto) {
    return this.tasks.transition(req.user, id, dto.action, dto.comment, dto.assigneeId);
  }

  @Delete(':id')
  remove(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.tasks.remove(req.user, id);
  }
}
