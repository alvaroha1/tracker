import { useEffect, useState, type FormEvent } from 'react';
import type { FoodTemplate } from './types';
import type { FoodTemplateInput } from './useFoodTemplates';

type FoodTemplatesPanelProps = {
  templates: FoodTemplate[];
  editingTemplate: FoodTemplate | null;
  onSubmit: (payload: FoodTemplateInput) => string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCancelEdit: () => void;
};

export function FoodTemplatesPanel({
  templates,
  editingTemplate,
  onSubmit,
  onEdit,
  onDelete,
  onCancelEdit,
}: FoodTemplatesPanelProps) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinGrams, setProteinGrams] = useState('');
  const [carbsGrams, setCarbsGrams] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editingTemplate) {
      setName('');
      setCalories('');
      setProteinGrams('');
      setCarbsGrams('');
      setError(null);
      return;
    }

    setName(editingTemplate.name);
    setCalories(editingTemplate.calories.toString());
    setProteinGrams(editingTemplate.proteinGrams.toString());
    setCarbsGrams(editingTemplate.carbsGrams.toString());
    setError(null);
  }, [editingTemplate]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const maybeError = onSubmit({ name, calories, proteinGrams, carbsGrams });

    if (maybeError) {
      setError(maybeError);
      return;
    }

    setError(null);
    setName('');
    setCalories('');
    setProteinGrams('');
    setCarbsGrams('');
  }

  return (
    <section className="card">
      <h2>Recurrent dishes</h2>
      <p className="muted-text">
        Save dishes you repeat often so you can autofill macros in the food form.
      </p>

      <form className="entry-form" onSubmit={handleSubmit}>
        <label>
          Dish name
          <input
            type="text"
            placeholder="e.g. Oatmeal with whey"
            value={name}
            onChange={(event) => setName(event.target.value)}
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
            value={carbsGrams}
            onChange={(event) => setCarbsGrams(event.target.value)}
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="form-actions">
          <button type="submit">
            {editingTemplate ? 'Save dish changes' : 'Save recurrent dish'}
          </button>
          {editingTemplate ? (
            <button type="button" className="button-secondary" onClick={onCancelEdit}>
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {templates.length === 0 ? (
        <p>No recurrent dishes yet.</p>
      ) : (
        <table className="log-table">
          <thead>
            <tr>
              <th>Dish</th>
              <th>Calories</th>
              <th>Protein (g)</th>
              <th>Carbs (g)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id}>
                <td>{template.name}</td>
                <td>{template.calories.toFixed(0)}</td>
                <td>{template.proteinGrams.toFixed(1)}</td>
                <td>{template.carbsGrams.toFixed(1)}</td>
                <td className="action-buttons">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => onEdit(template.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button-danger"
                    onClick={() => onDelete(template.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
