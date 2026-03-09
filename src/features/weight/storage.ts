import type { WeightEntry } from './types';

const STORAGE_KEY = 'fitslave.weight.entries.v1';

export function loadWeightEntries(): WeightEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isWeightEntry);
  } catch {
    return [];
  }
}

export function saveWeightEntries(entries: WeightEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function isWeightEntry(value: unknown): value is WeightEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<WeightEntry>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.weightKg === 'number' &&
    Number.isFinite(candidate.weightKg) &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string'
  );
}
