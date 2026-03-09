export type ActivityType = 'steps' | 'gym_class';

type ActivityEntryBase = {
  id: string;
  date: string;
  type: ActivityType;
  createdAt: string;
  updatedAt: string;
};

export type StepsActivityEntry = ActivityEntryBase & {
  type: 'steps';
  steps: number;
  classConcept: null;
};

export type GymClassActivityEntry = ActivityEntryBase & {
  type: 'gym_class';
  steps: null;
  classConcept: string;
};

export type ActivityEntry = StepsActivityEntry | GymClassActivityEntry;
