import { IsBoolean, IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Введите пароль' })
  password!: string;

  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}

export class DevSwitchDto {
  @IsString({ message: 'Укажите роль' })
  @MinLength(1, { message: 'Укажите роль' })
  role!: string;
}

export class RegisterCompanyDto {
  @IsString()
  @MinLength(1, { message: 'Укажите название компании' })
  companyName!: string;

  @IsString()
  @MinLength(1, { message: 'Укажите имя' })
  firstName!: string;

  @IsString()
  @MinLength(1, { message: 'Укажите фамилию' })
  lastName!: string;

  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Пароль — не менее 6 символов' })
  password!: string;
}

export class RegisterByInviteDto {
  @IsString()
  @MinLength(1, { message: 'Ссылка приглашения неполная' })
  token!: string;

  @IsString()
  @MinLength(1, { message: 'Укажите имя' })
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsString()
  @MinLength(6, { message: 'Пароль — не менее 6 символов' })
  password!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Укажите имя' })
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string' && value.trim() !== '')
  @IsEmail({}, { message: 'Укажите корректный email' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  telegram?: string;
}

export class UpdateCompanyDto {
  @IsString()
  @MinLength(1, { message: 'Укажите название компании' })
  name!: string;

  @IsOptional()
  @IsString()
  inn?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
