import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ClientsService } from './clients.service';
import { ClientDto } from './dto';

@Controller('api/clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  list(@Req() req: { user: AuthPayload }) {
    return this.clients.list(req.user);
  }

  @Get(':id')
  get(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.clients.get(req.user, id);
  }

  @Post()
  create(@Req() req: { user: AuthPayload }, @Body() dto: ClientDto) {
    return this.clients.create(req.user, dto);
  }

  @Put(':id')
  update(@Req() req: { user: AuthPayload }, @Param('id') id: string, @Body() dto: ClientDto) {
    return this.clients.update(req.user, id, dto);
  }

  @Delete(':id')
  archive(@Req() req: { user: AuthPayload }, @Param('id') id: string) {
    return this.clients.archive(req.user, id);
  }
}
