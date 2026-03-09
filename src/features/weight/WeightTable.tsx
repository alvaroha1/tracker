import type { WeightEntry } from './types';

type WeightTableProps = {
  entries: WeightEntry[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function WeightTable({ entries, onEdit, onDelete }: WeightTableProps) {
  return (
    <section className="card">
      <h2>Weight log</h2>

      {entries.length === 0 ? (
        <p>No entries yet. Add your first daily weight above.</p>
      ) : (
        <table className="log-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Weight (kg)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.date}</td>
                <td>{entry.weightKg.toFixed(1)}</td>
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
