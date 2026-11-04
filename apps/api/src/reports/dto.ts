import { ReportStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class GenerateReportDto {
  @IsString()
  @MinLength(1, { message: 'Укажите проект' })
  projectId!: string;

  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Укажите месяц в формате ГГГГ-ММ' })
  month!: string;

  @IsOptional()
  @IsString()
  summaryText?: string;
}

export class UpdateReportStatusDto {
  @IsEnum(ReportStatus, { message: 'Укажите статус отчёта' })
  status!: ReportStatus;
}

export class SendReportDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;
}
