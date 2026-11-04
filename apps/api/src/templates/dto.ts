import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class TypeDto {
  @IsString()
  @MinLength(1, { message: 'Укажите название типа' })
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['violet', 'emerald', 'blue', 'amber', 'cyan', 'rose'])
  color?: string;
}

export class RoadmapDto {
  @IsString()
  projectTypeId!: string;

  @IsString()
  @MinLength(1, { message: 'Укажите название карты' })
  name!: string;
}

export class StageDto {
  @IsString()
  @MinLength(1, { message: 'Укажите название направления' })
  title!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  monthIndex?: number;
}

export class WorkDto {
  @IsString()
  @MinLength(1, { message: 'Укажите название работы' })
  title!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hours?: number;

  @IsOptional()
  @IsIn(['seo', 'pm', 'contractor'])
  role?: 'seo' | 'pm' | 'contractor';
}
