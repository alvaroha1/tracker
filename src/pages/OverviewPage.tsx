import { loadActivityEntries } from '../features/activity/storage';
import { loadFoodEntries } from '../features/food/storage';
import { loadWeightEntries } from '../features/weight/storage';
import { PieChart } from '../components/PieChart';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

type WindowRange = {
  startDay: number;
  endDay: number;
};

type Comparison = {
  current: number | null;
  pctChange: number | null;
};

function isStepsEntry(
  entry: ReturnType<typeof loadActivityEntries>[number],
): entry is Extract<ReturnType<typeof loadActivityEntries>[number], { type: 'steps' }> {
  return entry.type === 'steps';
}

function isGymClassEntry(
  entry: ReturnType<typeof loadActivityEntries>[number],
): entry is Extract<
  ReturnType<typeof loadActivityEntries>[number],
  { type: 'gym_class' }
> {
  return entry.type === 'gym_class';
}

function dayIndexFromDate(value: string): number {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) {
    return Number.NaN;
  }

  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

function todayDayIndex(): number {
  const now = new Date();
  return Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / MS_PER_DAY,
  );
}

function lastNDaysRange(days: number, endDay: number): WindowRange {
  return { startDay: endDay - days + 1, endDay };
}

function previousRange(range: WindowRange): WindowRange {
  const size = range.endDay - range.startDay + 1;
  return { startDay: range.startDay - size, endDay: range.startDay - 1 };
}

function includesDay(range: WindowRange, day: number): boolean {
  return day >= range.startDay && day <= range.endDay;
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function compare(current: number | null, previous: number | null): Comparison {
  if (previous === null || previous === 0 || current === null) {
    return { current, pctChange: null };
  }

  return {
    current,
    pctChange: ((current - previous) / previous) * 100,
  };
}

function formatWithUnit(value: number | null, digits: number, unit: string): string {
  if (value === null) {
    return 'No data';
  }

  return `${value.toFixed(digits)} ${unit}`;
}

function formatPct(value: number | null): string {
  if (value === null) {
    return 'n/a';
  }

  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function toTopSlices(
  map: Map<string, number>,
  maxSlices: number,
): Array<{ label: string; value: number }> {
  const sorted = [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  if (sorted.length <= maxSlices) {
    return sorted;
  }

  const top = sorted.slice(0, maxSlices - 1);
  const otherValue = sorted.slice(maxSlices - 1).reduce((sum, entry) => sum + entry.value, 0);
  return [...top, { label: 'Other', value: otherValue }];
}

export function OverviewPage() {
  const weights = loadWeightEntries();
  const foods = loadFoodEntries();
  const activities = loadActivityEntries();
  const today = todayDayIndex();

  const weight7Range = lastNDaysRange(7, today);
  const weight30Range = lastNDaysRange(30, today);
  const previousWeight7Range = previousRange(weight7Range);
  const previousWeight30Range = previousRange(weight30Range);

  const weight7Comparison = compare(
    average(
      weights
        .filter((entry) => includesDay(weight7Range, dayIndexFromDate(entry.date)))
        .map((entry) => entry.weightKg),
    ),
    average(
      weights
        .filter((entry) => includesDay(previousWeight7Range, dayIndexFromDate(entry.date)))
        .map((entry) => entry.weightKg),
    ),
  );

  const weight30Comparison = compare(
    average(
      weights
        .filter((entry) => includesDay(weight30Range, dayIndexFromDate(entry.date)))
        .map((entry) => entry.weightKg),
    ),
    average(
      weights
        .filter((entry) => includesDay(previousWeight30Range, dayIndexFromDate(entry.date)))
        .map((entry) => entry.weightKg),
    ),
  );

  const todayWeight = weights.find((entry) => dayIndexFromDate(entry.date) === today) ?? null;

  const food7Range = lastNDaysRange(7, today);
  const food30Range = lastNDaysRange(30, today);
  const todayFoodEntries = foods.filter((entry) => dayIndexFromDate(entry.date) === today);
  const food7Entries = foods.filter((entry) =>
    includesDay(food7Range, dayIndexFromDate(entry.date)),
  );
  const food30Entries = foods.filter((entry) =>
    includesDay(food30Range, dayIndexFromDate(entry.date)),
  );

  const averageCalories7 =
    food7Entries.length > 0
      ? food7Entries.reduce((sum, entry) => sum + entry.calories, 0) / 7
      : null;
  const averageProtein7 =
    food7Entries.length > 0
      ? food7Entries.reduce((sum, entry) => sum + entry.proteinGrams, 0) / 7
      : null;
  const averageCarbs7 =
    food7Entries.length > 0
      ? food7Entries.reduce((sum, entry) => sum + entry.carbsGrams, 0) / 7
      : null;

  const averageCalories30 =
    food30Entries.length > 0
      ? food30Entries.reduce((sum, entry) => sum + entry.calories, 0) / 30
      : null;
  const averageProtein30 =
    food30Entries.length > 0
      ? food30Entries.reduce((sum, entry) => sum + entry.proteinGrams, 0) / 30
      : null;
  const averageCarbs30 =
    food30Entries.length > 0
      ? food30Entries.reduce((sum, entry) => sum + entry.carbsGrams, 0) / 30
      : null;

  const todayCalories = todayFoodEntries.reduce((sum, entry) => sum + entry.calories, 0);
  const todayProtein = todayFoodEntries.reduce((sum, entry) => sum + entry.proteinGrams, 0);
  const todayCarbs = todayFoodEntries.reduce((sum, entry) => sum + entry.carbsGrams, 0);

  const todayActivityEntries = activities.filter(
    (entry) => dayIndexFromDate(entry.date) === today,
  );
  const todaySteps = todayActivityEntries.reduce(
    (sum, entry) => (entry.type === 'steps' ? sum + entry.steps : sum),
    0,
  );
  const todayGymClasses = todayActivityEntries.filter(isGymClassEntry).length;

  const steps30Range = lastNDaysRange(30, today);
  const steps30Entries = activities.filter(
    (entry) =>
      isStepsEntry(entry) &&
      includesDay(steps30Range, dayIndexFromDate(entry.date)),
  );
  const averageSteps30 =
    steps30Entries.length > 0
      ? steps30Entries.reduce(
          (sum, entry) => (entry.type === 'steps' ? sum + entry.steps : sum),
          0,
        ) / 30
      : null;

  const gymClassEntriesLast30Days = activities.filter(
    (entry) =>
      isGymClassEntry(entry) &&
      includesDay(steps30Range, dayIndexFromDate(entry.date)),
  );
  const gymVisitsLast30Days = gymClassEntriesLast30Days.length;

  const caloriesByConceptToday = new Map<string, number>();
  for (const entry of todayFoodEntries) {
    caloriesByConceptToday.set(
      entry.concept,
      (caloriesByConceptToday.get(entry.concept) ?? 0) + entry.calories,
    );
  }

  const caloriesByConceptLast7Days = new Map<string, number>();
  for (const entry of food7Entries) {
    caloriesByConceptLast7Days.set(
      entry.concept,
      (caloriesByConceptLast7Days.get(entry.concept) ?? 0) + entry.calories,
    );
  }

  const classesByConcept = new Map<string, number>();
  for (const entry of gymClassEntriesLast30Days) {
    if (entry.type !== 'gym_class') {
      continue;
    }

    classesByConcept.set(
      entry.classConcept,
      (classesByConcept.get(entry.classConcept) ?? 0) + 1,
    );
  }

  return (
    <div className="entry-grid">
      <section className="card">
        <h2>Overview</h2>
        <p className="muted-text">Trends and current snapshot from your local data.</p>
      </section>

      <section className="card">
        <h2>Today</h2>
        <div className="overview-grid">
          <article className="metric-card">
            <h3>Food consumption</h3>
            <p className="metric-subtext">Calories: {formatWithUnit(todayCalories, 0, 'kcal')}</p>
            <p className="metric-subtext">Protein: {formatWithUnit(todayProtein, 1, 'g')}</p>
            <p className="metric-subtext">Carbs: {formatWithUnit(todayCarbs, 1, 'g')}</p>
          </article>
          <article className="metric-card">
            <h3>Activity</h3>
            <p className="metric-subtext">Steps: {formatWithUnit(todaySteps, 0, 'steps')}</p>
            <p className="metric-subtext">Gym classes: {todayGymClasses}</p>
            <p className="metric-subtext">
              Weight: {todayWeight ? formatWithUnit(todayWeight.weightKg, 2, 'kg') : 'No data'}
            </p>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Weight overview</h2>
        <div className="overview-grid">
          <article className="metric-card">
            <h3>Last 7 days avg</h3>
            <p className="metric-value">
              {formatWithUnit(weight7Comparison.current, 2, 'kg')}
            </p>
            <p className="metric-subtext">
              vs previous 7 days: {formatPct(weight7Comparison.pctChange)}
            </p>
          </article>
          <article className="metric-card">
            <h3>Last 30 days avg</h3>
            <p className="metric-value">
              {formatWithUnit(weight30Comparison.current, 2, 'kg')}
            </p>
            <p className="metric-subtext">
              vs previous 30 days: {formatPct(weight30Comparison.pctChange)}
            </p>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Food overview</h2>
        <div className="overview-grid">
          <article className="metric-card">
            <h3>Daily avg (last 7 days)</h3>
            <p className="metric-subtext">
              Calories: {formatWithUnit(averageCalories7, 0, 'kcal/day')}
            </p>
            <p className="metric-subtext">
              Protein: {formatWithUnit(averageProtein7, 1, 'g/day')}
            </p>
            <p className="metric-subtext">
              Carbs: {formatWithUnit(averageCarbs7, 1, 'g/day')}
            </p>
          </article>
          <article className="metric-card">
            <h3>Daily avg (last 30 days)</h3>
            <p className="metric-subtext">
              Calories: {formatWithUnit(averageCalories30, 0, 'kcal/day')}
            </p>
            <p className="metric-subtext">
              Protein: {formatWithUnit(averageProtein30, 1, 'g/day')}
            </p>
            <p className="metric-subtext">
              Carbs: {formatWithUnit(averageCarbs30, 1, 'g/day')}
            </p>
          </article>
          <PieChart
            title="Calories by dish (today)"
            slices={toTopSlices(caloriesByConceptToday, 6)}
            emptyMessage="No food entries today."
          />
          <PieChart
            title="Calories by dish (last 7 days)"
            slices={toTopSlices(caloriesByConceptLast7Days, 6)}
            emptyMessage="No food entries in the last 7 days."
          />
        </div>
      </section>

      <section className="card">
        <h2>Activity overview</h2>
        <div className="overview-grid">
          <article className="metric-card">
            <h3>Average steps (last 30 days)</h3>
            <p className="metric-value">{formatWithUnit(averageSteps30, 0, 'steps/day')}</p>
          </article>
          <article className="metric-card">
            <h3>Gym class visits (last 30 days)</h3>
            <p className="metric-value">{gymVisitsLast30Days}</p>
          </article>
          <PieChart
            title="Gym classes by concept (last 30 days)"
            slices={toTopSlices(classesByConcept, 6)}
            emptyMessage="No gym classes in the last 30 days."
          />
        </div>
      </section>
    </div>
  );
}
