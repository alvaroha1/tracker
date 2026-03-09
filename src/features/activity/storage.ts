import type { ActivityEntry } from './types';

const STORAGE_KEY = 'fitslave.activity.entries.v1';

export function loadActivityEntries(): ActivityEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap(parseActivityEntry);
  } catch {
    return [];
  }
}

export function saveActivityEntries(entries: ActivityEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function parseActivityEntry(value: unknown): ActivityEntry[] {
  if (typeof value !== 'object' || value === null) {
    return [];
  }

  const candidate = value as Record<string, unknown>;
  const id = typeof candidate.id === 'string' ? candidate.id : null;
  const date = typeof candidate.date === 'string' ? candidate.date : null;
  const createdAt =
    typeof candidate.createdAt === 'string' ? candidate.createdAt : null;
  const updatedAt =
    typeof candidate.updatedAt === 'string' ? candidate.updatedAt : null;

  if (!id || !date || !createdAt || !updatedAt) {
    return [];
  }

  const type = candidate.type;
  const steps = candidate.steps;
  const classConcept = candidate.classConcept;

  if (
    type === 'steps' &&
    typeof steps === 'number' &&
    Number.isFinite(steps)
  ) {
    return [
      {
        id,
        date,
        type: 'steps',
        steps,
        classConcept: null,
        createdAt,
        updatedAt,
      },
    ];
  }

  if (type === 'gym_class' && typeof classConcept === 'string') {
    return [
      {
        id,
        date,
        type: 'gym_class',
        steps: null,
        classConcept,
        createdAt,
        updatedAt,
      },
    ];
  }

  const migrated: ActivityEntry[] = [];
  if (typeof steps === 'number' && Number.isFinite(steps)) {
    migrated.push({
      id: `${id}-steps`,
      date,
      type: 'steps',
      steps,
      classConcept: null,
      createdAt,
      updatedAt,
    });
  }

  if (typeof classConcept === 'string' && classConcept.trim()) {
    migrated.push({
      id: `${id}-class`,
      date,
      type: 'gym_class',
      steps: null,
      classConcept: classConcept.trim(),
      createdAt,
      updatedAt,
    });
  }

  return migrated;
}
