
import { Habit, StreakData } from './types';

export const getTodayDateString = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const formatDateForGrid = (year: number, month: number, day: number): string => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

// Added getCalendarGrid to fix missing export error in MonthlyCalendar.tsx
export const getCalendarGrid = (year: number, month: number): (string | null)[] => {
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysCount = getDaysInMonth(year, month);
  const grid: (string | null)[] = [];
  
  for (let i = 0; i < firstDayOfMonth; i++) {
    grid.push(null);
  }
  
  for (let day = 1; day <= daysCount; day++) {
    grid.push(formatDateForGrid(year, month, day));
  }
  
  return grid;
};

export const getWeekDays = (): string[] => {
  const today = new Date();
  const day = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - day);
  
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDays.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return weekDays;
};

export const calculateDrought = (completedDates: string[], createdAt: string): number => {
  const today = new Date(getTodayDateString());
  const start = new Date(createdAt);
  let maxDrought = 0;
  let currentDrought = 0;
  
  const temp = new Date(start);
  while (temp <= today) {
    const ds = temp.toISOString().split('T')[0];
    if (!completedDates.includes(ds)) {
      currentDrought++;
    } else {
      maxDrought = Math.max(maxDrought, currentDrought);
      currentDrought = 0;
    }
    temp.setDate(temp.getDate() + 1);
  }
  return Math.max(maxDrought, currentDrought);
};

export const getWeekdayPerformance = (habits: Habit[]) => {
  const counts = [0, 0, 0, 0, 0, 0, 0];
  const totals = [0, 0, 0, 0, 0, 0, 0];
  
  habits.forEach(h => {
    const start = new Date(h.createdAt);
    const end = new Date(getTodayDateString());
    const temp = new Date(start);
    
    while (temp <= end) {
      const dayIdx = temp.getDay();
      const ds = temp.toISOString().split('T')[0];
      totals[dayIdx]++;
      if (h.completedDates.includes(ds)) {
        counts[dayIdx]++;
      }
      temp.setDate(temp.getDate() + 1);
    }
  });

  return counts.map((c, i) => ({
    index: i,
    percentage: totals[i] > 0 ? (c / totals[i]) * 100 : 0
  }));
};

export const calculateStreak = (completedDates: string[]): StreakData => {
  if (completedDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, isCompletedToday: false };
  }

  const today = getTodayDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  const isCompletedToday = completedDates.includes(today);
  let currentStreak = 0;
  if (isCompletedToday || completedDates.includes(yesterdayStr)) {
    let tempDate = isCompletedToday ? new Date() : yesterday;
    while (true) {
      const ds = tempDate.toISOString().split('T')[0];
      if (completedDates.includes(ds)) {
        currentStreak++;
        tempDate.setDate(tempDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  let longestStreak = 0;
  let running = 0;
  const uniqueSorted = Array.from(new Set(completedDates)).sort();
  if (uniqueSorted.length > 0) {
    running = 1;
    longestStreak = 1;
    for (let i = 1; i < uniqueSorted.length; i++) {
      const d1 = new Date(uniqueSorted[i-1]);
      const d2 = new Date(uniqueSorted[i]);
      const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) running++;
      else running = 1;
      longestStreak = Math.max(longestStreak, running);
    }
  }

  return { currentStreak, longestStreak, isCompletedToday };
};
