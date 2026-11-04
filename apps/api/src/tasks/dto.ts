import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

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
