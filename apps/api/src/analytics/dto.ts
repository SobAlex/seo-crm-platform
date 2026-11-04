import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ImportQueriesDto {
  @IsString()
  @MinLength(1, { message: 'Добавьте хотя бы одну поисковую фразу' })
  @MaxLength(100_000)
  rawText!: string;
}

export class UpdateSourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  metrikaCounter?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  goalIds?: string[];
}
