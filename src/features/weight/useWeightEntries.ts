import { useMemo, useState } from 'react';
import { loadWeightEntries, saveWeightEntries } from './storage';
import type { WeightEntry } from './types';

export type WeightFormInput = {
  date: string;
  weightKg: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function toNumber(value: string): number {
  return Number.parseFloat(value);
}

function sortLatestFirst(entries: WeightEntry[]): WeightEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export function useWeightEntries() {
  const [entries, setEntries] = useState<WeightEntry[]>(() =>
    sortLatestFirst(loadWeightEntries()),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingEntry = useMemo(
    () => entries.find((entry) => entry.id === editingId) ?? null,
    [editingId, entries],
  );

  function addOrUpdate(input: WeightFormInput): string | null {
    const numericWeight = toNumber(input.weightKg);

    if (!input.date) {
      return 'Date is required.';
    }

    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      return 'Weight must be a positive number.';
    }

    const timestamp = nowIso();

    const next = (() => {
      if (editingId) {
        return entries.map((entry) =>
          entry.id === editingId
            ? {
                ...entry,
                date: input.date,
                weightKg: numericWeight,
                updatedAt: timestamp,
              }
            : entry,
        );
      }

      const duplicatedByDate = entries.find((entry) => entry.date === input.date);
      if (duplicatedByDate) {
        return entries.map((entry) =>
          entry.id === duplicatedByDate.id
            ? {
                ...entry,
                weightKg: numericWeight,
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
          weightKg: numericWeight,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ];
    })();

    const sorted = sortLatestFirst(next);
    setEntries(sorted);
    saveWeightEntries(sorted);
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
    saveWeightEntries(next);

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
