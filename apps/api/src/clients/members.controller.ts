import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { assertCan } from '../access';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() req: { user: AuthPayload }) {
    assertCan(req.user, 'directory.view');
    const rows = await this.prisma.companyMember.findMany({
      where: { companyId: req.user.companyId, isActive: true },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
    });
    return rows.map((row) => ({
      id: row.user.id,
      name: `${row.user.firstName} ${row.user.lastName}`.trim(),
      email: row.user.email,
      role: row.role,
    }));
  }
}
