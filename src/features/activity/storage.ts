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

  const candidate = value as Partial<
    ActivityEntry & { steps?: number; classConcept?: string | null }
  >;

  const hasBaseFields =
    typeof candidate.id === 'string' &&
    typeof candidate.date === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.updatedAt === 'string';

  if (!hasBaseFields) {
    return [];
  }

  if (
    candidate.type === 'steps' &&
    typeof candidate.steps === 'number' &&
    Number.isFinite(candidate.steps)
  ) {
    return [
      {
        id: candidate.id,
        date: candidate.date,
        type: 'steps',
        steps: candidate.steps,
        classConcept: null,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
      },
    ];
  }

  if (candidate.type === 'gym_class' && typeof candidate.classConcept === 'string') {
    return [
      {
        id: candidate.id,
        date: candidate.date,
        type: 'gym_class',
        steps: null,
        classConcept: candidate.classConcept,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
      },
    ];
  }

  const migrated: ActivityEntry[] = [];
  if (typeof candidate.steps === 'number' && Number.isFinite(candidate.steps)) {
    migrated.push({
      id: `${candidate.id}-steps`,
      date: candidate.date,
      type: 'steps',
      steps: candidate.steps,
      classConcept: null,
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    });
  }

  if (typeof candidate.classConcept === 'string' && candidate.classConcept.trim()) {
    migrated.push({
      id: `${candidate.id}-class`,
      date: candidate.date,
      type: 'gym_class',
      steps: null,
      classConcept: candidate.classConcept.trim(),
      createdAt: candidate.createdAt,
      updatedAt: candidate.updatedAt,
    });
  }

  return migrated;
}
