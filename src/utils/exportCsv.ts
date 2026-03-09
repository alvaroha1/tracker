import { loadActivityEntries } from '../features/activity/storage';
import { loadFoodEntries } from '../features/food/storage';
import { loadWeightEntries } from '../features/weight/storage';

function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function toCsvRow(cells: Array<string | number | null>): string {
  return cells
    .map((cell) => (cell === null ? '' : escapeCell(String(cell))))
    .join(',');
}

export function exportAllDataToCsv(): void {
  const weights = loadWeightEntries();
  const foods = loadFoodEntries();
  const activities = loadActivityEntries();

  const header = toCsvRow([
    'category',
    'date',
    'weight_kg',
    'food_concept',
    'calories',
    'protein_grams',
    'carbs_grams',
    'activity_type',
    'steps',
    'gym_class_concept',
    'created_at',
    'updated_at',
  ]);

  const rows: string[] = [header];

  for (const entry of weights) {
    rows.push(
      toCsvRow([
        'weight',
        entry.date,
        entry.weightKg,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        entry.createdAt,
        entry.updatedAt,
      ]),
    );
  }

  for (const entry of foods) {
    rows.push(
      toCsvRow([
        'food',
        entry.date,
        null,
        entry.concept,
        entry.calories,
        entry.proteinGrams,
        entry.carbsGrams,
        null,
        null,
        null,
        entry.createdAt,
        entry.updatedAt,
      ]),
    );
  }

  for (const entry of activities) {
    rows.push(
      toCsvRow([
        'activity',
        entry.date,
        null,
        null,
        null,
        null,
        null,
        entry.type,
        entry.type === 'steps' ? entry.steps : null,
        entry.type === 'gym_class' ? entry.classConcept : null,
        entry.createdAt,
        entry.updatedAt,
      ]),
    );
  }

  const csv = `${rows.join('\n')}\n`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const fileStamp = now.toISOString().slice(0, 10);
  const link = document.createElement('a');
  link.href = url;
  link.download = `fitslave-export-${fileStamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
