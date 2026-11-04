import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1, { message: 'Укажите название проекта' })
  name!: string;

  @IsOptional()
  @IsString()
  domain?: string;
}
