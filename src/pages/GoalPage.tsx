import { useMemo, useState, type FormEvent } from 'react';
import { loadActivityEntries } from '../features/activity/storage';
import { loadGoalSettings, saveGoalSettings } from '../features/goal/storage';
import { loadWeightEntries } from '../features/weight/storage';
import type { ActivityEntry } from '../features/activity/types';
import type { GoalSettings } from '../features/goal/types';
import type { WeightEntry } from '../features/weight/types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function nowIso(): string {
  return new Date().toISOString();
}

function formatKg(value: number | null, digits = 2): string {
  if (value === null || Number.isNaN(value)) {
    return 'n/a';
  }

  return `${value.toFixed(digits)} kg`;
}

function formatDuration(days: number | null): string {
  if (days === null) {
    return 'n/a';
  }

  if (days === 0) {
    return 'Reached';
  }

  const weeks = days / 7;
  const months = days / 30;
  return `${days} days (${weeks.toFixed(1)} weeks, ${months.toFixed(1)} months)`;
}

function formatDate(value: Date | null): string {
  if (!value) {
    return 'n/a';
  }

  return value.toISOString().slice(0, 10);
}

function latestWeight(entries: WeightEntry[]): WeightEntry | null {
  if (entries.length === 0) {
    return null;
  }

  return [...entries].sort((a, b) => b.date.localeCompare(a.date))[0] ?? null;
}

function toUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function dailyRateKg(entries: WeightEntry[], lookbackDays: number): number | null {
  if (entries.length < 2) {
    return null;
  }

  const latest = latestWeight(entries);
  if (!latest) {
    return null;
  }

  const latestDate = toUtcDate(latest.date);
  const fromMs = latestDate.getTime() - (lookbackDays - 1) * MS_PER_DAY;

  const inWindow = entries
    .filter((entry) => {
      const entryMs = toUtcDate(entry.date).getTime();
      return entryMs >= fromMs && entryMs <= latestDate.getTime();
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  if (inWindow.length < 2) {
    return null;
  }

  const first = inWindow[0];
  const last = inWindow[inWindow.length - 1];
  const firstMs = toUtcDate(first.date).getTime();
  const lastMs = toUtcDate(last.date).getTime();
  const elapsedDays = Math.max(1, Math.round((lastMs - firstMs) / MS_PER_DAY));
  return (last.weightKg - first.weightKg) / elapsedDays;
}

function progressPercent(goal: GoalSettings, currentWeight: number): number {
  const totalDelta = goal.targetWeightKg - goal.baselineWeightKg;
  if (totalDelta === 0) {
    return 100;
  }

  const completedDelta = currentWeight - goal.baselineWeightKg;
  const ratio = completedDelta / totalDelta;
  const bounded = Math.min(1, Math.max(0, ratio));
  return bounded * 100;
}

function daysToTarget(
  currentWeight: number,
  targetWeight: number,
  rateKgPerDay: number | null,
): number | null {
  const remaining = targetWeight - currentWeight;
  if (Math.abs(remaining) < 0.0001) {
    return 0;
  }

  if (rateKgPerDay === null || Math.abs(rateKgPerDay) < 0.0001) {
    return null;
  }

  const movingTowardGoal =
    (remaining > 0 && rateKgPerDay > 0) || (remaining < 0 && rateKgPerDay < 0);

  if (!movingTowardGoal) {
    return null;
  }

  return Math.ceil(Math.abs(remaining / rateKgPerDay));
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function weekStartIso(date: string): string {
  const parsed = toUtcDate(date);
  const day = parsed.getUTCDay();
  const offset = (day + 6) % 7;
  const start = new Date(parsed.getTime() - offset * MS_PER_DAY);
  return start.toISOString().slice(0, 10);
}

type WeeklyTrend = {
  week: string;
  weightChangeKg: number;
  steps: number;
  gymClasses: number;
};

function buildWeeklyTrends(weights: WeightEntry[], activities: ActivityEntry[]): WeeklyTrend[] {
  const weightsByWeek = new Map<string, WeightEntry[]>();
  for (const entry of weights) {
    const key = weekStartIso(entry.date);
    const current = weightsByWeek.get(key) ?? [];
    current.push(entry);
    weightsByWeek.set(key, current);
  }

  const activityByWeek = new Map<string, { steps: number; gymClasses: number }>();
  for (const entry of activities) {
    const key = weekStartIso(entry.date);
    const current = activityByWeek.get(key) ?? { steps: 0, gymClasses: 0 };
    if (entry.type === 'steps') {
      current.steps += entry.steps;
    } else if (entry.type === 'gym_class') {
      current.gymClasses += 1;
    }
    activityByWeek.set(key, current);
  }

  const trends: WeeklyTrend[] = [];
  for (const [week, entries] of weightsByWeek.entries()) {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length < 2) {
      continue;
    }

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const activity = activityByWeek.get(week) ?? { steps: 0, gymClasses: 0 };
    trends.push({
      week,
      weightChangeKg: last.weightKg - first.weightKg,
      steps: activity.steps,
      gymClasses: activity.gymClasses,
    });
  }

  return trends.sort((a, b) => a.week.localeCompare(b.week));
}

type Milestone = {
  percent: number;
  eta: Date | null;
  reached: boolean;
};

export function GoalPage() {
  const weightEntries = loadWeightEntries();
  const activityEntries = loadActivityEntries();
  const currentWeightEntry = latestWeight(weightEntries);
  const currentWeight = currentWeightEntry?.weightKg ?? null;
  const currentWeightDate = currentWeightEntry ? toUtcDate(currentWeightEntry.date) : null;
  const rateKgPerDay = dailyRateKg(weightEntries, 14);
  const [goal, setGoal] = useState<GoalSettings | null>(() => loadGoalSettings());
  const [targetInput, setTargetInput] = useState<string>(
    goal ? goal.targetWeightKg.toString() : '',
  );
  const [error, setError] = useState<string | null>(null);

  const daysNeeded = useMemo(() => {
    if (!goal || currentWeight === null) {
      return null;
    }

    return daysToTarget(currentWeight, goal.targetWeightKg, rateKgPerDay);
  }, [goal, currentWeight, rateKgPerDay]);

  const missingKg =
    goal && currentWeight !== null ? Math.abs(goal.targetWeightKg - currentWeight) : null;
  const completedPct =
    goal && currentWeight !== null ? progressPercent(goal, currentWeight) : null;
  const weeklyRate = rateKgPerDay === null ? null : rateKgPerDay * 7;
  const monthlyRate = rateKgPerDay === null ? null : rateKgPerDay * 30;
  const missingPct = completedPct === null ? null : Math.max(0, 100 - completedPct);

  const milestones = useMemo<Milestone[]>(() => {
    if (!goal || currentWeight === null || !currentWeightDate) {
      return [25, 50, 75, 100].map((percent) => ({ percent, eta: null, reached: false }));
    }

    const totalDelta = goal.targetWeightKg - goal.baselineWeightKg;
    const progress = progressPercent(goal, currentWeight);

    return [25, 50, 75, 100].map((percent) => {
      if (progress >= percent) {
        return { percent, eta: null, reached: true };
      }

      const milestoneWeight = goal.baselineWeightKg + (totalDelta * percent) / 100;
      const days = daysToTarget(currentWeight, milestoneWeight, rateKgPerDay);
      return {
        percent,
        eta: days === null ? null : addDays(currentWeightDate, days),
        reached: false,
      };
    });
  }, [goal, currentWeight, currentWeightDate, rateKgPerDay]);

  const weeklyTrends = useMemo(
    () => buildWeeklyTrends(weightEntries, activityEntries),
    [weightEntries, activityEntries],
  );
  const stepsMedian = median(weeklyTrends.map((trend) => trend.steps));
  const highStepsTrends =
    stepsMedian === null
      ? []
      : weeklyTrends.filter((trend) => trend.steps >= stepsMedian);
  const lowStepsTrends =
    stepsMedian === null
      ? []
      : weeklyTrends.filter((trend) => trend.steps < stepsMedian);
  const avgHighStepsChange = average(highStepsTrends.map((trend) => trend.weightChangeKg));
  const avgLowStepsChange = average(lowStepsTrends.map((trend) => trend.weightChangeKg));
  const withGymClass = weeklyTrends.filter((trend) => trend.gymClasses > 0);
  const withoutGymClass = weeklyTrends.filter((trend) => trend.gymClasses === 0);
  const avgWithGymChange = average(withGymClass.map((trend) => trend.weightChangeKg));
  const avgWithoutGymChange = average(withoutGymClass.map((trend) => trend.weightChangeKg));

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setError(null);

    const target = Number.parseFloat(targetInput);
    if (!Number.isFinite(target) || target <= 0) {
      setError('Target weight must be a positive number.');
      return;
    }

    if (currentWeight === null) {
      setError('Add at least one weight entry before defining a goal.');
      return;
    }

    const timestamp = nowIso();
    const nextGoal: GoalSettings = {
      targetWeightKg: target,
      baselineWeightKg: currentWeight,
      createdAt: goal?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    saveGoalSettings(nextGoal);
    setGoal(nextGoal);
  }

  return (
    <div className="entry-grid">
      <section className="card">
        <h2>Goal</h2>
        <p className="muted-text">
          Define your target weight and track progress against your current trend.
        </p>
      </section>

      <section className="card">
        <h2>Set target</h2>
        <form className="entry-form" onSubmit={onSubmit}>
          <label>
            Target weight (kg)
            <input
              type="number"
              min="1"
              step="0.1"
              value={targetInput}
              onChange={(event) => setTargetInput(event.target.value)}
              placeholder="e.g. 72.5"
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="form-actions">
            <button type="submit">Save goal</button>
          </div>
        </form>
      </section>

      <section className="card">
        <h2>Progress</h2>
        <div className="goal-progress">
          <div
            className="goal-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(completedPct ?? 0)}
          >
            <div
              className="goal-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, completedPct ?? 0))}%` }}
            />
            {milestones.map((milestone) => (
              <span
                key={milestone.percent}
                className={milestone.reached ? 'goal-progress-dot goal-progress-dot-done' : 'goal-progress-dot'}
                style={{ left: `${milestone.percent}%` }}
              />
            ))}
          </div>
          <p className="metric-subtext">
            {completedPct === null ? 'No progress data yet.' : `Completion: ${completedPct.toFixed(1)}%`}
          </p>
          <div className="goal-progress-milestones">
            {milestones.map((milestone) => (
              <div key={milestone.percent} className="goal-milestone-item">
                <p className="goal-milestone-title">{milestone.percent}%</p>
                <p className="goal-milestone-eta">
                  {milestone.reached ? 'Reached' : formatDate(milestone.eta)}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="overview-grid">
          <article className="metric-card">
            <h3>Current weight</h3>
            <p className="metric-value">{formatKg(currentWeight)}</p>
            <p className="metric-subtext">
              Target: {goal ? formatKg(goal.targetWeightKg) : 'n/a'}
            </p>
          </article>

          <article className="metric-card">
            <h3>Estimated days to target</h3>
            <p className="metric-value">
              {formatDuration(daysNeeded)}
            </p>
            <p className="metric-subtext">
              Rate used: {rateKgPerDay === null ? 'n/a' : `${rateKgPerDay.toFixed(3)} kg/day`}
            </p>
          </article>

          <article className="metric-card">
            <h3>What&apos;s missing</h3>
            <p className="metric-value">
              {formatKg(missingKg)}
            </p>
            <p className="metric-subtext">
              Missing: {missingPct === null ? 'n/a' : `${missingPct.toFixed(1)}%`}
            </p>
          </article>

          <article className="metric-card">
            <h3>Rate projections</h3>
            <p className="metric-subtext">
              Per day: {rateKgPerDay === null ? 'n/a' : `${rateKgPerDay.toFixed(3)} kg`}
            </p>
            <p className="metric-subtext">
              Per week: {weeklyRate === null ? 'n/a' : `${weeklyRate.toFixed(2)} kg`}
            </p>
            <p className="metric-subtext">
              Per month: {monthlyRate === null ? 'n/a' : `${monthlyRate.toFixed(2)} kg`}
            </p>
          </article>
        </div>
      </section>

      <section className="card">
        <h2>Activity relation</h2>
        <p className="muted-text">
          Weekly association between activity and weight trend (association, not causation).
        </p>
        <div className="overview-grid">
          <article className="metric-card">
            <h3>High-step vs low-step weeks</h3>
            <p className="metric-subtext">
              High-step avg weekly change: {formatKg(avgHighStepsChange, 3)}
            </p>
            <p className="metric-subtext">
              Low-step avg weekly change: {formatKg(avgLowStepsChange, 3)}
            </p>
            <p className="metric-subtext">
              Step split threshold: {stepsMedian === null ? 'n/a' : `${Math.round(stepsMedian)} steps/week`}
            </p>
          </article>
          <article className="metric-card">
            <h3>Gym class impact</h3>
            <p className="metric-subtext">
              With gym classes: {formatKg(avgWithGymChange, 3)} /week
            </p>
            <p className="metric-subtext">
              Without gym classes: {formatKg(avgWithoutGymChange, 3)} /week
            </p>
            <p className="metric-subtext">
              Weeks analyzed: {weeklyTrends.length}
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
