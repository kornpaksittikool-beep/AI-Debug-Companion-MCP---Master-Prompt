import { Injectable } from '@nestjs/common';
import { PlatformError } from '../../../core/errors/platform-error.js';
import type { EngineeringPlan } from '../interfaces/planning-impact.interface.js';

@Injectable()
export class PlanningStoreService {
  private readonly plans = new Map<string, EngineeringPlan>();

  save(plan: EngineeringPlan): EngineeringPlan {
    this.plans.set(plan.id, plan);
    return plan;
  }

  get(planId: string): EngineeringPlan {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new PlatformError({
        code: 'PLAN_NOT_FOUND',
        message: `Plan "${planId}" was not found.`,
        reason: 'The planning store does not contain a plan with the requested ID.',
        suggestion: 'Create a plan first or provide a valid plan ID.',
      });
    }

    return plan;
  }
}
