import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class ClientDto {
  @IsString()
  @MinLength(1, { message: 'Укажите название компании' })
  name!: string;

  @IsString()
  @MinLength(1, { message: 'Укажите контактное лицо' })
  contactPerson!: string;

  @IsEmail({}, { message: 'Укажите корректный email' })
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  inn?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  contactPosition?: string;

  @IsOptional()
  @IsString()
  ratePerHour?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'LEAD', 'PAUSED'])
  status?: 'ACTIVE' | 'LEAD' | 'PAUSED';
}
