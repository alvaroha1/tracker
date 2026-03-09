import { useMemo, useState } from 'react';
import { loadFoodTemplates, saveFoodTemplates } from './templateStorage';
import type { FoodTemplate } from './types';

export type FoodTemplateInput = {
  name: string;
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

function sortByName(templates: FoodTemplate[]): FoodTemplate[] {
  return [...templates].sort((a, b) => a.name.localeCompare(b.name));
}

export function useFoodTemplates() {
  const [templates, setTemplates] = useState<FoodTemplate[]>(() =>
    sortByName(loadFoodTemplates()),
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTemplate = useMemo(
    () => templates.find((template) => template.id === editingId) ?? null,
    [editingId, templates],
  );

  function addOrUpdate(input: FoodTemplateInput): string | null {
    const name = input.name.trim();
    const calories = toNumber(input.calories);
    const proteinGrams = toNumber(input.proteinGrams);
    const carbsGrams = toNumber(input.carbsGrams);

    if (!name) {
      return 'Dish name is required.';
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
        return templates.map((template) =>
          template.id === editingId
            ? {
                ...template,
                name,
                calories,
                proteinGrams,
                carbsGrams,
                updatedAt: timestamp,
              }
            : template,
        );
      }

      const existingByName = templates.find(
        (template) => template.name.toLowerCase() === name.toLowerCase(),
      );
      if (existingByName) {
        return templates.map((template) =>
          template.id === existingByName.id
            ? {
                ...template,
                calories,
                proteinGrams,
                carbsGrams,
                updatedAt: timestamp,
              }
            : template,
        );
      }

      return [
        ...templates,
        {
          id: crypto.randomUUID(),
          name,
          calories,
          proteinGrams,
          carbsGrams,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ];
    })();

    const sorted = sortByName(next);
    setTemplates(sorted);
    saveFoodTemplates(sorted);
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
    const next = templates.filter((template) => template.id !== id);
    setTemplates(next);
    saveFoodTemplates(next);

    if (editingId === id) {
      setEditingId(null);
    }
  }

  return {
    templates,
    editingTemplate,
    addOrUpdate,
    startEdit,
    cancelEdit,
    remove,
  };
}
