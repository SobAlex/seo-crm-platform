import { PlanTier } from '@prisma/client';

export const PLAN_LIMITS: Record<Exclude<PlanTier, 'TRIAL'>, { maxProjects: number; maxMembers: number; price: number; title: string }> = {
  START: { maxProjects: 3, maxMembers: 3, price: 1900, title: 'Старт' },
  PRO: { maxProjects: 15, maxMembers: 10, price: 4900, title: 'Про' },
  AGENCY: { maxProjects: 100, maxMembers: 100, price: 9900, title: 'Агентство' },
};

export const TRIAL_LIMITS = { maxProjects: 5, maxMembers: 5, days: 14 };
