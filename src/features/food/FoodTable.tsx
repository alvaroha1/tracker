import type { FoodEntry } from './types';

type FoodTableProps = {
  entries: FoodEntry[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSaveAsTemplate: (id: string) => void;
};

export function FoodTable({
  entries,
  onEdit,
  onDelete,
  onSaveAsTemplate,
}: FoodTableProps) {
  return (
    <section className="card">
      <h2>Food log</h2>

      {entries.length === 0 ? (
        <p>No entries yet. Add your first food entry above.</p>
      ) : (
        <table className="log-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Concept</th>
              <th>Calories</th>
              <th>Protein (g)</th>
              <th>Carbs (g)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.date}</td>
                <td>{entry.concept}</td>
                <td>{entry.calories.toFixed(0)}</td>
                <td>{entry.proteinGrams.toFixed(1)}</td>
                <td>{entry.carbsGrams.toFixed(1)}</td>
                <td className="action-buttons">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => onEdit(entry.id)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => onSaveAsTemplate(entry.id)}
                  >
                    Save Dish
                  </button>
                  <button
                    type="button"
                    className="button-danger"
                    onClick={() => onDelete(entry.id)}
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
