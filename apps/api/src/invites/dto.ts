import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateInviteDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Укажите роль' })
  role!: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}
