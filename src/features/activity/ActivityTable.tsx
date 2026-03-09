import type { ActivityEntry } from './types';

type ActivityTableProps = {
  entries: ActivityEntry[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

export function ActivityTable({ entries, onEdit, onDelete }: ActivityTableProps) {
  return (
    <section className="card">
      <h2>Activity log</h2>

      {entries.length === 0 ? (
        <p>No entries yet. Add your first activity entry above.</p>
      ) : (
        <table className="log-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Details</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.date}</td>
                <td>{entry.type === 'steps' ? 'Steps' : 'Gym class'}</td>
                <td>
                  {entry.type === 'steps'
                    ? `${entry.steps.toFixed(0)} steps`
                    : entry.classConcept}
                </td>
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
