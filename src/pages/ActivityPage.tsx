import { ActivityForm } from '../features/activity/ActivityForm';
import { ActivityTable } from '../features/activity/ActivityTable';
import { useActivityEntries } from '../features/activity/useActivityEntries';

export function ActivityPage() {
  const { entries, editingEntry, addOrUpdate, startEdit, cancelEdit, remove } =
    useActivityEntries();

  return (
    <div className="entry-grid">
      <ActivityForm
        editingEntry={editingEntry}
        onCancelEdit={cancelEdit}
        onSubmit={addOrUpdate}
      />
      <ActivityTable entries={entries} onEdit={startEdit} onDelete={remove} />
    </div>
  );
}
