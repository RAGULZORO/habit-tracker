
export interface Habit {
  id: string;
  name: string;
  goal: string;
  color: string;
  completedDates: string[]; // ISO YYYY-MM-DD
  createdAt: string;
  reminderTime?: string; // HH:mm format
  reminderDays?: number[]; // [0-6] where 0 is Sunday
}

export interface DayProgress {
  date: string;
  dayName: string;
  isToday: boolean;
  isCompleted: boolean;
}

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  isCompletedToday: boolean;
};
