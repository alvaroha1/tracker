import type { GoalSettings } from './types';

const STORAGE_KEY = 'fitslave.goal.settings.v1';

export function loadGoalSettings(): GoalSettings | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return isGoalSettings(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveGoalSettings(goal: GoalSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goal));
}

function isGoalSettings(value: unknown): value is GoalSettings {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<GoalSettings>;
  return (
    typeof candidate.targetWeightKg === 'number' &&
    Number.isFinite(candidate.targetWeightKg) &&
    candidate.targetWeightKg > 0 &&
    typeof candidate.baselineWeightKg === 'number' &&
    Number.isFinite(candidate.baselineWeightKg) &&
    candidate.baselineWeightKg > 0 &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  );
}
