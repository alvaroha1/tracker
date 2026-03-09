import { useEffect, useState, type FormEvent } from 'react';
import type { ActivityEntry } from './types';
import type { ActivityFormInput } from './useActivityEntries';

type ActivityFormProps = {
  editingEntry: ActivityEntry | null;
  onCancelEdit: () => void;
  onSubmit: (payload: ActivityFormInput) => string | null;
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ActivityForm({
  editingEntry,
  onCancelEdit,
  onSubmit,
}: ActivityFormProps) {
  const [date, setDate] = useState(todayDateString());
  const [type, setType] = useState<ActivityFormInput['type']>('steps');
  const [steps, setSteps] = useState('');
  const [classConcept, setClassConcept] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingEntry) {
      setDate(todayDateString());
      setType('steps');
      setSteps('');
      setClassConcept('');
      setError(null);
      return;
    }

    setDate(editingEntry.date);
    setType(editingEntry.type);
    setSteps(editingEntry.type === 'steps' ? editingEntry.steps.toString() : '');
    setClassConcept(editingEntry.type === 'gym_class' ? editingEntry.classConcept : '');
    setError(null);
  }, [editingEntry]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const maybeError = onSubmit({ date, type, steps, classConcept });

    if (maybeError) {
      setError(maybeError);
      return;
    }

    setError(null);
    if (!editingEntry) {
      setType('steps');
      setSteps('');
      setClassConcept('');
    }
  }

  return (
    <section className="card">
      <h2>{editingEntry ? 'Edit activity' : 'Add activity'}</h2>
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
          Type
          <select
            value={type}
            onChange={(event) => setType(event.target.value as ActivityFormInput['type'])}
            required
          >
            <option value="steps">Steps</option>
            <option value="gym_class">Gym class</option>
          </select>
        </label>

        {type === 'steps' ? (
          <label>
            Steps
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="e.g. 8500"
              value={steps}
              onChange={(event) => setSteps(event.target.value)}
              required
            />
          </label>
        ) : (
          <label>
            Gym class concept
            <input
              type="text"
              placeholder="e.g. Strength Endurance with Dinesh"
              value={classConcept}
              onChange={(event) => setClassConcept(event.target.value)}
              required
            />
          </label>
        )}

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
