
export interface Habit {
  id: string;
  name: string;
  goal: string; // Keep for descriptive text
  color: string;
  completedDates: string[]; // Still used for boolean-only habits
  createdAt: string;
  reminderTime?: string;
  reminderDays?: number[];
  
  // New Measurable Goal fields
  targetValue?: number;
  unit?: string;
  dailyLogs?: Record<string, number>; // dateStr -> current progress
}

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  isCompletedToday: boolean;
};

export interface YearlyReportData {
  totalCompletions: number;
  bestStreak: number;
  perfectWeeks: number;
  dominantColor: string;
  daysSincePlanting: number;
  isEligible: boolean;
}