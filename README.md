# FitSlave

Local-first fitness tracker that runs in the browser.

## Current scope (MVP)

- Fully implemented: `Weight`
  - Add daily weight entries (`date`, `weightKg`)
  - View log sorted by latest date first
  - Edit existing entries
  - Delete entries
  - Persistence using browser `localStorage`
  - If a date already exists, submitting that date updates the existing value
- Fully implemented: `Food`
  - Add food entries (`date`, `concept`, `calories`, `protein grams`, `carbs grams`)
  - Same dish can be logged multiple times on the same day
  - View log sorted by latest date first
  - Edit existing entries
  - Delete entries
  - Persistence using browser `localStorage`
  - Recurrent dishes:
    - Save dish templates with default calories/protein/carbs
    - Autofill the food form from a template
    - Save a log entry as a template in one click
    - Manage templates (edit/delete)
- Fully implemented: `Activity`
  - Add typed activity entries (`steps` or `gym class concept`)
  - Multiple entries per day are supported
  - View log sorted by latest date first
  - Edit existing entries
  - Delete entries
  - Persistence using browser `localStorage`
- Fully implemented: `Overview`
  - Today snapshot for current consumption and activity
    - Calories, protein, carbs consumed today
    - Steps and gym classes logged today
    - Today's weight (if logged)
  - Weight average for last 7 and 30 days
  - Weight % change vs previous 7 and 30 day windows
  - Food daily averages (calories/protein/carbs) for last 7 and 30 days
  - Average steps/day for the last 30 days
  - Gym class visits in the last 30 days
  - Pie chart for calories by dish concept (last 30 days)
  - Pie chart for gym classes by concept (last 30 days)
  - CSV export/import actions in the top bar for all entries (weight, food, activity)
- Theming
  - Slim top bar selector to switch styles
  - `default`: Vercel-inspired style
  - Evangelion mecha themes by code:
    - `EVA-01`, `EVA-02`
  - Selected theme is persisted in browser `localStorage`

## Tech stack

- React + TypeScript + Vite
- React Router for tab routing
- Browser localStorage for data persistence

## Run locally

1. `npm install`
2. `npm run dev`
3. Open the URL shown by Vite (usually `http://localhost:5173`)

## Project structure

- `src/components/AppLayout.tsx`: Header and tab navigation
- `src/theme/themes.ts`: Theme ids and validation
- `src/pages/WeightPage.tsx`: Weight tab page container
- `src/pages/FoodPage.tsx`: Food tab page container
- `src/features/weight/`: Weight feature modules
  - `useWeightEntries.ts`: State, validation, CRUD, persistence wiring
  - `WeightForm.tsx`: Add/edit form
  - `WeightTable.tsx`: Entries log table
  - `storage.ts`: localStorage serializer/deserializer
  - `types.ts`: Weight types
- `src/features/food/`: Food feature modules
  - `useFoodEntries.ts`: State, validation, CRUD, persistence wiring
  - `useFoodTemplates.ts`: Recurrent dish template state and CRUD
  - `FoodForm.tsx`: Add/edit form
  - `FoodTable.tsx`: Entries log table
  - `FoodTemplatesPanel.tsx`: Template manager UI
  - `storage.ts`: localStorage serializer/deserializer
  - `templateStorage.ts`: localStorage for templates
  - `types.ts`: Food types
- `src/pages/ActivityPage.tsx`: Activity tab page container
- `src/features/activity/`: Activity feature modules
  - `useActivityEntries.ts`: State, validation, CRUD, persistence wiring
  - `ActivityForm.tsx`: Add/edit form
  - `ActivityTable.tsx`: Entries log table
  - `storage.ts`: localStorage serializer/deserializer
  - `types.ts`: Activity types
- `src/pages/OverviewPage.tsx`: Placeholder

## Next milestones

1. Charts for weight/food/activity trends.
2. Optional: unit preference (kg/lb) and export/import backup.
