import { WeightForm } from '../features/weight/WeightForm';
import { WeightTable } from '../features/weight/WeightTable';
import { useWeightEntries } from '../features/weight/useWeightEntries';

export function WeightPage() {
  const { entries, editingEntry, addOrUpdate, startEdit, cancelEdit, remove } =
    useWeightEntries();

  return (
    <div className="entry-grid">
      <WeightForm
        editingEntry={editingEntry}
        onCancelEdit={cancelEdit}
        onSubmit={addOrUpdate}
      />
      <WeightTable entries={entries} onEdit={startEdit} onDelete={remove} />
    </div>
  );
}
