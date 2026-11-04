import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1, { message: 'Укажите название проекта' })
  name!: string;

  @IsOptional()
  @IsString()
  domain?: string;

  @IsOptional()
  @IsString()
  siteUrl?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  projectTypeId?: string;

  @IsOptional()
  @IsString()
  roadmapTemplateId?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  budgetMonthly?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  hoursLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetTraffic?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  targetLeads?: number;

  @IsOptional()
  @IsString()
  startMonth?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  kpis?: string[];

  @IsOptional()
  @IsString()
  pmId?: string;

  @IsOptional()
  @IsString()
  seoId?: string;
}

export class UpdateProjectDto extends CreateProjectDto {}
