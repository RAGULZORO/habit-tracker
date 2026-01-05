import React, { useMemo } from 'react';
import { Habit } from '../types';
import { calculateDrought, getWeekdayPerformance, getTodayDateString } from '../utils';
import { DAYS_OF_WEEK } from '../constants';

interface RitualFrictionReportProps {
  habits: Habit[];
}

const RitualFrictionReport: React.FC<RitualFrictionReportProps> = ({ habits }) => {
  const today = getTodayDateString();

  const metrics = useMemo(() => {
    if (habits.length === 0) return null;

    // 1. Find Thirsty Ritual (lowest completion rate)
    const completionRates = habits.map(h => {
      const start = new Date(h.createdAt);
      const now = new Date(today);
      const totalDays = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      return { 
        ...h, 
        rate: (h.completedDates.length / totalDays) * 100 
      };
    });
    const thirstyHabit = [...completionRates].sort((a, b) => a.rate - b.rate)[0];

    // 2. Find Longest Drought (gap in any habit)
    const droughtData = habits.map(h => ({
      name: h.name,
      drought: calculateDrought(h.completedDates, h.createdAt)
    }));
    const worstDrought = [...droughtData].sort((a, b) => b.drought - a.drought)[0];

    // 3. Find Weakest Day of Week
    const weekdayData = getWeekdayPerformance(habits);
    const weakestDay = [...weekdayData].sort((a, b) => a.percentage - b.percentage)[0];

    return { thirstyHabit, worstDrought, weakestDay };
  }, [habits, today]);

  if (!metrics || habits.length === 0) return null;

  return (
    <div className="bg-white rounded-[40px] p-8 md:p-10 border border-orange-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Garden Friction</h2>
          <p className="text-xs font-bold text-orange-400 uppercase tracking-[0.2em] mt-1">Data-driven performance analysis</p>
        </div>
        
        <div className="flex gap-4">
          <div className="px-5 py-3 bg-orange-50 rounded-2xl border border-orange-100">
            <span className="block text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Drought Level</span>
            <span className="text-xl font-black text-orange-700">{metrics.worstDrought.drought}d</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
          <span className="text-2xl mb-3 block">🏜️</span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Thirsty Ritual</span>
          <h4 className="text-lg font-black text-gray-900 leading-tight mb-2">{metrics.thirstyHabit.name}</h4>
          <p className="text-[10px] font-medium text-gray-500">Only <span className="text-orange-600 font-bold">{Math.round(metrics.thirstyHabit.rate)}%</span> consistency since planting.</p>
        </div>

        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
          <span className="text-2xl mb-3 block">⚠️</span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Critical Drought</span>
          <h4 className="text-lg font-black text-gray-900 leading-tight mb-2">{metrics.worstDrought.name}</h4>
          <p className="text-[10px] font-medium text-gray-500">Experienced a <span className="text-orange-600 font-bold">{metrics.worstDrought.drought}-day</span> gap in ritual.</p>
        </div>

        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
          <span className="text-2xl mb-3 block">📉</span>
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Weakest Window</span>
          <h4 className="text-lg font-black text-gray-900 leading-tight mb-2">{DAYS_OF_WEEK[metrics.weakestDay.index]}s</h4>
          <p className="text-[10px] font-medium text-gray-500">Your success rate dips to <span className="text-orange-600 font-bold">{Math.round(metrics.weakestDay.percentage)}%</span> on this day.</p>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-100 flex items-start gap-4">
        <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center shrink-0">
          <span className="text-lg">🔎</span>
        </div>
        <div>
          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Botanist's Prescription</h5>
          <p className="text-xs font-medium text-gray-500 leading-relaxed">
            Your metrics show significant friction on <span className="text-gray-900 font-bold">{DAYS_OF_WEEK[metrics.weakestDay.index]}s</span>. 
            {metrics.worstDrought.drought > 3 
              ? ` The ${metrics.worstDrought.drought}-day drought for "${metrics.worstDrought.name}" suggests this ritual is currently being neglected. Consider simplifying the goal to lower the barrier of entry.` 
              : " Your droughts are short, but your overall consistency on the thirsty rituals suggests a lack of non-negotiable scheduling."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RitualFrictionReport;