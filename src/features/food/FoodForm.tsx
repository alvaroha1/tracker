import { useEffect, useState, type FormEvent } from 'react';
import type { FoodEntry, FoodTemplate } from './types';
import type { FoodFormInput } from './useFoodEntries';
import type { FoodTemplateInput } from './useFoodTemplates';

type FoodFormProps = {
  editingEntry: FoodEntry | null;
  templates: FoodTemplate[];
  onCancelEdit: () => void;
  onSubmit: (payload: FoodFormInput) => string | null;
  onSaveAsTemplate: (payload: FoodTemplateInput) => string | null;
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function FoodForm({
  editingEntry,
  templates,
  onCancelEdit,
  onSubmit,
  onSaveAsTemplate,
}: FoodFormProps) {
  const [date, setDate] = useState(todayDateString());
  const [templateId, setTemplateId] = useState('');
  const [concept, setConcept] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinGrams, setProteinGrams] = useState('');
  const [carbsGrams, setCarbsGrams] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingEntry) {
      setDate(todayDateString());
      setTemplateId('');
      setConcept('');
      setCalories('');
      setProteinGrams('');
      setCarbsGrams('');
      setError(null);
      return;
    }

    setDate(editingEntry.date);
    setTemplateId('');
    setConcept(editingEntry.concept);
    setCalories(editingEntry.calories.toString());
    setProteinGrams(editingEntry.proteinGrams.toString());
    setCarbsGrams(editingEntry.carbsGrams.toString());
    setError(null);
  }, [editingEntry]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const maybeError = onSubmit({
      date,
      concept,
      calories,
      proteinGrams,
      carbsGrams,
    });

    if (maybeError) {
      setError(maybeError);
      return;
    }

    setError(null);
    if (!editingEntry) {
      setTemplateId('');
      setConcept('');
      setCalories('');
      setProteinGrams('');
      setCarbsGrams('');
    }
  }

  function handleTemplateSelect(value: string): void {
    setTemplateId(value);
    if (!value) {
      return;
    }

    const selected = templates.find((template) => template.id === value);
    if (!selected) {
      return;
    }

    setConcept(selected.name);
    setCalories(selected.calories.toString());
    setProteinGrams(selected.proteinGrams.toString());
    setCarbsGrams(selected.carbsGrams.toString());
    setError(null);
  }

  function handleSaveAsTemplate(): void {
    const maybeError = onSaveAsTemplate({
      name: concept,
      calories,
      proteinGrams,
      carbsGrams,
    });

    if (maybeError) {
      setError(maybeError);
      return;
    }

    setError(null);
  }

  return (
    <section className="card">
      <h2>{editingEntry ? 'Edit food entry' : 'Add food entry'}</h2>
      <form className="entry-form" onSubmit={handleSubmit}>
        <label>
          Recurrent dish
          <select
            value={templateId}
            onChange={(event) => handleTemplateSelect(event.target.value)}
          >
            <option value="">Manual entry</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>

        <label>
          Concept
          <input
            type="text"
            placeholder="e.g. Chicken salad"
            value={concept}
            onChange={(event) => setConcept(event.target.value)}
            required
          />
        </label>

        <label>
          Calories
          <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="e.g. 450"
            value={calories}
            onChange={(event) => setCalories(event.target.value)}
            required
          />
        </label>

        <label>
          Protein (g)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            placeholder="e.g. 35"
            value={proteinGrams}
            onChange={(event) => setProteinGrams(event.target.value)}
            required
          />
        </label>

        <label>
          Carbs (g)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            placeholder="e.g. 22"
            value={carbsGrams}
            onChange={(event) => setCarbsGrams(event.target.value)}
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions">
          <button type="submit">{editingEntry ? 'Save changes' : 'Add entry'}</button>
          <button type="button" className="button-secondary" onClick={handleSaveAsTemplate}>
            Save as recurrent dish
          </button>
          {editingEntry ? (
            <button type="button" className="button-secondary" onClick={onCancelEdit}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
