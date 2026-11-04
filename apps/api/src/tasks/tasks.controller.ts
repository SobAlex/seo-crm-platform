import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransitionTaskDto } from './dto';
import { TasksService } from './tasks.service';

@Controller('api/tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post(':id/transition')
  transition(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: TransitionTaskDto) {
    return this.tasks.transition(req.user, id, dto.action, dto.comment, dto.assigneeId);
  }
}
