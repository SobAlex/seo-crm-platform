import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

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
