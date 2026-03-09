import { FoodForm } from '../features/food/FoodForm';
import { FoodTable } from '../features/food/FoodTable';
import { useFoodEntries } from '../features/food/useFoodEntries';
import { FoodTemplatesPanel } from '../features/food/FoodTemplatesPanel';
import { useFoodTemplates } from '../features/food/useFoodTemplates';

export function FoodPage() {
  const { entries, editingEntry, addOrUpdate, startEdit, cancelEdit, remove } =
    useFoodEntries();
  const {
    templates,
    editingTemplate,
    addOrUpdate: addOrUpdateTemplate,
    startEdit: startEditTemplate,
    cancelEdit: cancelEditTemplate,
    remove: removeTemplate,
  } = useFoodTemplates();

  function saveEntryAsTemplate(entryId: string) {
    const source = entries.find((entry) => entry.id === entryId);
    if (!source) {
      return;
    }

    addOrUpdateTemplate({
      name: source.concept,
      calories: source.calories.toString(),
      proteinGrams: source.proteinGrams.toString(),
      carbsGrams: source.carbsGrams.toString(),
    });
  }

  return (
    <div className="entry-grid">
      <FoodForm
        editingEntry={editingEntry}
        templates={templates}
        onCancelEdit={cancelEdit}
        onSubmit={addOrUpdate}
        onSaveAsTemplate={addOrUpdateTemplate}
      />
      <FoodTable
        entries={entries}
        onEdit={startEdit}
        onDelete={remove}
        onSaveAsTemplate={saveEntryAsTemplate}
      />
      <FoodTemplatesPanel
        templates={templates}
        editingTemplate={editingTemplate}
        onSubmit={addOrUpdateTemplate}
        onEdit={startEditTemplate}
        onDelete={removeTemplate}
        onCancelEdit={cancelEditTemplate}
      />
    </div>
  );
}
