import type { FoodTemplate } from './types';

const STORAGE_KEY = 'fitslave.food.templates.v1';

export function loadFoodTemplates(): FoodTemplate[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isFoodTemplate);
  } catch {
    return [];
  }
}

export function saveFoodTemplates(templates: FoodTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function isFoodTemplate(value: unknown): value is FoodTemplate {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<FoodTemplate>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.calories === 'number' &&
    Number.isFinite(candidate.calories) &&
    typeof candidate.proteinGrams === 'number' &&
    Number.isFinite(candidate.proteinGrams) &&
    typeof candidate.carbsGrams === 'number' &&
    Number.isFinite(candidate.carbsGrams) &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  );
}
