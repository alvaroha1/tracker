import { useMemo, useState } from 'react';
import { loadActivityEntries, saveActivityEntries } from './storage';
import type { ActivityEntry, ActivityType } from './types';

export type ActivityFormInput = {
  date: string;
  type: ActivityType;
  steps: string;
  classConcept: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function toNumber(value: string): number {
  return Number.parseFloat(value);
}

function toActivityEntry(
  input: ActivityFormInput,
  id: string,
  createdAt: string,
  updatedAt: string,
): ActivityEntry {
  if (input.type === 'steps') {
    return {
      id,
      date: input.date,
      type: 'steps',
      steps: toNumber(input.steps),
      classConcept: null,
      createdAt,
      updatedAt,
    };
  }

  return {
    id,
    date: input.date,
    type: 'gym_class',
    steps: null,
    classConcept: input.classConcept.trim(),
    createdAt,
    updatedAt,
  };
}

function sortLatestFirst(entries: ActivityEntry[]): ActivityEntry[] {
  return [...entries].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate !== 0) {
      return byDate;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function useActivityEntries() {
  const [entries, setEntries] = useState<ActivityEntry[]>(() =>
    sortLatestFirst(loadActivityEntries()),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingEntry = useMemo(
    () => entries.find((entry) => entry.id === editingId) ?? null,
    [editingId, entries],
  );

  function addOrUpdate(input: ActivityFormInput): string | null {
    const steps = toNumber(input.steps);
    const classConcept = input.classConcept.trim();

    if (!input.date) {
      return 'Date is required.';
    }

    if (input.type === 'steps' && (!Number.isFinite(steps) || steps < 0)) {
      return 'Steps must be zero or a positive number.';
    }

    if (input.type === 'gym_class' && !classConcept) {
      return 'Gym class concept is required.';
    }

    const timestamp = nowIso();

    const next = (() => {
      if (editingId) {
        return entries.map((entry) =>
          entry.id === editingId
            ? toActivityEntry(input, entry.id, entry.createdAt, timestamp)
            : entry,
        );
      }

      return [
        ...entries,
        toActivityEntry(input, crypto.randomUUID(), timestamp, timestamp),
      ];
    })();

    const sorted = sortLatestFirst(next);
    setEntries(sorted);
    saveActivityEntries(sorted);
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
    saveActivityEntries(next);

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
