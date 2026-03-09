import { useEffect, useState, type FormEvent } from 'react';
import type { WeightEntry } from './types';
import type { WeightFormInput } from './useWeightEntries';

type WeightFormProps = {
  editingEntry: WeightEntry | null;
  onCancelEdit: () => void;
  onSubmit: (payload: WeightFormInput) => string | null;
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function WeightForm({ editingEntry, onCancelEdit, onSubmit }: WeightFormProps) {
  const [date, setDate] = useState(todayDateString());
  const [weightKg, setWeightKg] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingEntry) {
      setDate(todayDateString());
      setWeightKg('');
      setError(null);
      return;
    }

    setDate(editingEntry.date);
    setWeightKg(editingEntry.weightKg.toString());
    setError(null);
  }, [editingEntry]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const maybeError = onSubmit({ date, weightKg });

    if (maybeError) {
      setError(maybeError);
      return;
    }

    setError(null);
    if (!editingEntry) {
      setWeightKg('');
    }
  }

  return (
    <section className="card">
      <h2>{editingEntry ? 'Edit weight' : 'Add weight'}</h2>
      <form className="entry-form" onSubmit={handleSubmit}>
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
          Weight (kg)
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.1"
            placeholder="e.g. 78.4"
            value={weightKg}
            onChange={(event) => setWeightKg(event.target.value)}
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions">
          <button type="submit">{editingEntry ? 'Save changes' : 'Add entry'}</button>
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
