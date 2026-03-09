import { useMemo, useState } from 'react';
import { loadFoodEntries, saveFoodEntries } from './storage';
import type { FoodEntry } from './types';

export type FoodFormInput = {
  date: string;
  concept: string;
  calories: string;
  proteinGrams: string;
  carbsGrams: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function toNumber(value: string): number {
  return Number.parseFloat(value);
}

function sortLatestFirst(entries: FoodEntry[]): FoodEntry[] {
  return [...entries].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) {
      return byDate;
    }

    return a.concept.localeCompare(b.concept);
  });
}

export function useFoodEntries() {
  const [entries, setEntries] = useState<FoodEntry[]>(() =>
    sortLatestFirst(loadFoodEntries()),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingEntry = useMemo(
    () => entries.find((entry) => entry.id === editingId) ?? null,
    [editingId, entries],
  );

  function addOrUpdate(input: FoodFormInput): string | null {
    const concept = input.concept.trim();
    const calories = toNumber(input.calories);
    const proteinGrams = toNumber(input.proteinGrams);
    const carbsGrams = toNumber(input.carbsGrams);

    if (!input.date) {
      return 'Date is required.';
    }

    if (!concept) {
      return 'Concept is required.';
    }

    if (!Number.isFinite(calories) || calories <= 0) {
      return 'Calories must be a positive number.';
    }

    if (!Number.isFinite(proteinGrams) || proteinGrams < 0) {
      return 'Protein must be zero or a positive number.';
    }

    if (!Number.isFinite(carbsGrams) || carbsGrams < 0) {
      return 'Carbs must be zero or a positive number.';
    }

    const timestamp = nowIso();

    const next = (() => {
      if (editingId) {
        return entries.map((entry) =>
          entry.id === editingId
            ? {
                ...entry,
                date: input.date,
                concept,
                calories,
                proteinGrams,
                carbsGrams,
                updatedAt: timestamp,
              }
            : entry,
        );
      }

      return [
        ...entries,
        {
          id: crypto.randomUUID(),
          date: input.date,
          concept,
          calories,
          proteinGrams,
          carbsGrams,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ];
    })();

    const sorted = sortLatestFirst(next);
    setEntries(sorted);
    saveFoodEntries(sorted);
    setEditingId(null);

    return null;
  }

  function startEdit(id: string): void {
    setEditingId(id);
  }

  function cancelEdit(): void {
    setEditingId(null);
  }

  function remove(id: string): void {
    const next = entries.filter((entry) => entry.id !== id);
    setEntries(next);
    saveFoodEntries(next);

    if (editingId === id) {
      setEditingId(null);
    }
  }

  return {
    entries,
    editingEntry,
    addOrUpdate,
    startEdit,
    cancelEdit,
    remove,
  };
}
