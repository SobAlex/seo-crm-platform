import { PlanTier } from '@prisma/client';
import { IsEnum, IsInt, Max, Min } from 'class-validator';

export class ChangePlanDto {
  @IsEnum(PlanTier, { message: 'Укажите тариф' })
  plan!: PlanTier;

  @IsInt()
  @Min(1)
  @Max(24)
  periodMonths!: number;
}
