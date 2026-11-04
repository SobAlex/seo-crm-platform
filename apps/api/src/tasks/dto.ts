import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min, MinLength, ValidateIf } from 'class-validator';

export class TransitionTaskDto {
  @IsIn(['submit', 'accept', 'rework', 'assign'], { message: 'Укажите действие' })
  action!: 'submit' | 'accept' | 'rework' | 'assign';

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  assigneeId?: string;
}

export class CreateTaskDto {
  @IsString()
  @MinLength(1, { message: 'Укажите название задачи' })
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(1, { message: 'Выберите проект' })
  projectId!: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsBoolean()
  isInReport?: boolean;

  @IsOptional()
  @IsString()
  reportNote?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @IsOptional()
  @IsBoolean()
  isInReport?: boolean;

  @IsOptional()
  @IsString()
  reportNote?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  spentHours?: number;

  @IsOptional()
  @IsString()
  reviewComment?: string;
}

export class ChangeStatusDto {
  @IsIn(['submit', 'accept', 'rework'], { message: 'Укажите переход статуса' })
  action!: 'submit' | 'accept' | 'rework';

  @ValidateIf((dto: ChangeStatusDto) => dto.action === 'rework')
  @IsString()
  @MinLength(1, { message: 'Опишите, что исправить' })
  reason?: string;
}

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: 'Напишите сообщение' })
  text!: string;

  @IsOptional()
  @IsBoolean()
  isInReport?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hours?: number;
}
