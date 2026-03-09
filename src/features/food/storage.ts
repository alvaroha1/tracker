import type { FoodEntry } from './types';

const STORAGE_KEY = 'fitslave.food.entries.v1';

export function loadFoodEntries(): FoodEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isFoodEntry);
  } catch {
    return [];
  }
}

export function saveFoodEntries(entries: FoodEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function isFoodEntry(value: unknown): value is FoodEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<FoodEntry>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.concept === 'string' &&
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
