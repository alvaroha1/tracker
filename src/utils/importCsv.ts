import { loadActivityEntries, saveActivityEntries } from '../features/activity/storage';
import { loadFoodEntries, saveFoodEntries } from '../features/food/storage';
import { loadWeightEntries, saveWeightEntries } from '../features/weight/storage';
import type { ActivityEntry } from '../features/activity/types';
import type { FoodEntry } from '../features/food/types';
import type { WeightEntry } from '../features/weight/types';

type CsvImportResult = {
  addedWeight: number;
  addedFood: number;
  addedActivity: number;
  skipped: number;
  errors: string[];
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(cell);
      cell = '';
      continue;
    }

    if (char === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    if (char === '\r') {
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function asNumber(value: string): number | null {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function isDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function weightKey(entry: Pick<WeightEntry, 'date' | 'weightKg'>): string {
  return `${entry.date}|${entry.weightKg.toFixed(4)}`;
}

function foodKey(
  entry: Pick<FoodEntry, 'date' | 'concept' | 'calories' | 'proteinGrams' | 'carbsGrams'>,
): string {
  return [
    entry.date,
    normalize(entry.concept),
    entry.calories.toFixed(4),
    entry.proteinGrams.toFixed(4),
    entry.carbsGrams.toFixed(4),
  ].join('|');
}

function activityKey(
  entry: Pick<ActivityEntry, 'date' | 'type' | 'steps' | 'classConcept'>,
): string {
  return [
    entry.date,
    entry.type,
    entry.type === 'steps' ? entry.steps.toFixed(4) : normalize(entry.classConcept),
  ].join('|');
}

function getValue(row: string[], headerIndex: Map<string, number>, key: string): string {
  const index = headerIndex.get(key);
  if (index === undefined) {
    return '';
  }

  return row[index]?.trim() ?? '';
}

export async function importAllDataFromCsv(file: File): Promise<CsvImportResult> {
  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length < 2) {
    return {
      addedWeight: 0,
      addedFood: 0,
      addedActivity: 0,
      skipped: 0,
      errors: ['CSV has no data rows.'],
    };
  }

  const header = rows[0].map((value) => normalize(value));
  const headerIndex = new Map<string, number>(
    header.map((value, index) => [value, index]),
  );

  if (!headerIndex.has('category') || !headerIndex.has('date')) {
    return {
      addedWeight: 0,
      addedFood: 0,
      addedActivity: 0,
      skipped: rows.length - 1,
      errors: ['CSV must include at least category and date columns.'],
    };
  }

  const existingWeights = loadWeightEntries();
  const existingFoods = loadFoodEntries();
  const existingActivities = loadActivityEntries();

  const weightEntries = [...existingWeights];
  const foodEntries = [...existingFoods];
  const activityEntries = [...existingActivities];

  const weightKeys = new Set(weightEntries.map(weightKey));
  const foodKeys = new Set(foodEntries.map(foodKey));
  const activityKeys = new Set(activityEntries.map(activityKey));

  let addedWeight = 0;
  let addedFood = 0;
  let addedActivity = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const isEmpty = row.every((value) => value.trim() === '');
    if (isEmpty) {
      continue;
    }

    const category = normalize(getValue(row, headerIndex, 'category'));
    const date = getValue(row, headerIndex, 'date');

    if (!isDate(date)) {
      skipped += 1;
      errors.push(`Row ${rowIndex + 1}: invalid date.`);
      continue;
    }

    const createdAt = getValue(row, headerIndex, 'created_at') || new Date().toISOString();
    const updatedAt = getValue(row, headerIndex, 'updated_at') || createdAt;

    if (category === 'weight') {
      const numericWeight = asNumber(getValue(row, headerIndex, 'weight_kg'));
      if (numericWeight === null || numericWeight <= 0) {
        skipped += 1;
        errors.push(`Row ${rowIndex + 1}: invalid weight_kg.`);
        continue;
      }

      const newEntry: WeightEntry = {
        id: crypto.randomUUID(),
        date,
        weightKg: numericWeight,
        createdAt,
        updatedAt,
      };

      const key = weightKey(newEntry);
      if (weightKeys.has(key)) {
        skipped += 1;
        continue;
      }

      weightEntries.push(newEntry);
      weightKeys.add(key);
      addedWeight += 1;
      continue;
    }

    if (category === 'food') {
      const concept = getValue(row, headerIndex, 'food_concept');
      const calories = asNumber(getValue(row, headerIndex, 'calories'));
      const protein = asNumber(getValue(row, headerIndex, 'protein_grams'));
      const carbs = asNumber(getValue(row, headerIndex, 'carbs_grams'));

      if (!concept || calories === null || calories <= 0 || protein === null || protein < 0 || carbs === null || carbs < 0) {
        skipped += 1;
        errors.push(`Row ${rowIndex + 1}: invalid food values.`);
        continue;
      }

      const newEntry: FoodEntry = {
        id: crypto.randomUUID(),
        date,
        concept,
        calories,
        proteinGrams: protein,
        carbsGrams: carbs,
        createdAt,
        updatedAt,
      };

      const key = foodKey(newEntry);
      if (foodKeys.has(key)) {
        skipped += 1;
        continue;
      }

      foodEntries.push(newEntry);
      foodKeys.add(key);
      addedFood += 1;
      continue;
    }

    if (category === 'activity') {
      const activityType = normalize(getValue(row, headerIndex, 'activity_type'));

      if (activityType === 'steps') {
        const steps = asNumber(getValue(row, headerIndex, 'steps'));
        if (steps === null || steps < 0) {
          skipped += 1;
          errors.push(`Row ${rowIndex + 1}: invalid steps value.`);
          continue;
        }

        const newEntry: ActivityEntry = {
          id: crypto.randomUUID(),
          date,
          type: 'steps',
          steps,
          classConcept: null,
          createdAt,
          updatedAt,
        };

        const key = activityKey(newEntry);
        if (activityKeys.has(key)) {
          skipped += 1;
          continue;
        }

        activityEntries.push(newEntry);
        activityKeys.add(key);
        addedActivity += 1;
        continue;
      }

      if (activityType === 'gym_class') {
        const classConcept = getValue(row, headerIndex, 'gym_class_concept');
        if (!classConcept) {
          skipped += 1;
          errors.push(`Row ${rowIndex + 1}: invalid gym_class_concept.`);
          continue;
        }

        const newEntry: ActivityEntry = {
          id: crypto.randomUUID(),
          date,
          type: 'gym_class',
          steps: null,
          classConcept,
          createdAt,
          updatedAt,
        };

        const key = activityKey(newEntry);
        if (activityKeys.has(key)) {
          skipped += 1;
          continue;
        }

        activityEntries.push(newEntry);
        activityKeys.add(key);
        addedActivity += 1;
        continue;
      }

      skipped += 1;
      errors.push(`Row ${rowIndex + 1}: unknown activity_type.`);
      continue;
    }

    skipped += 1;
    errors.push(`Row ${rowIndex + 1}: unknown category.`);
  }

  if (addedWeight > 0) {
    saveWeightEntries(weightEntries);
  }
  if (addedFood > 0) {
    saveFoodEntries(foodEntries);
  }
  if (addedActivity > 0) {
    saveActivityEntries(activityEntries);
  }

  return {
    addedWeight,
    addedFood,
    addedActivity,
    skipped,
    errors,
  };
}
