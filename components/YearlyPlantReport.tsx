
import React, { useMemo } from 'react';
import { Habit, YearlyReportData } from '../types';

interface YearlyPlantReportProps {
  habits: Habit[];
  profileCreatedAt?: string;
}

const YearlyPlantReport: React.FC<YearlyPlantReportProps> = ({ habits, profileCreatedAt }) => {
  const stats = useMemo((): YearlyReportData => {
    const plantingDate = profileCreatedAt ? new Date(profileCreatedAt) : (habits.length > 0 ? new Date(habits[0].createdAt) : new Date());
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - plantingDate.getTime());
    const daysSincePlanting = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let totalCompletions = 0;
    let maxStreak = 0;
    const weeklyCompletions: Record<string, number> = {};

    habits.forEach(h => {
      totalCompletions += h.completedDates.length;
      // Simple streak extraction for yearly context
      const habitMax = h.completedDates.length > 0 ? h.completedDates.length : 0; 
      maxStreak = Math.max(maxStreak, habitMax);
      
      h.completedDates.forEach(date => {
        const d = new Date(date);
        const weekKey = `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`;
        weeklyCompletions[weekKey] = (weeklyCompletions[weekKey] || 0) + 1;
      });
    });

    const perfectWeeks = Object.values(weeklyCompletions).filter(count => count >= (habits.length * 7)).length;

    return {
      totalCompletions,
      bestStreak: maxStreak,
      perfectWeeks,
      dominantColor: habits[0]?.color?.split(' ')[1] || 'bloom',
      daysSincePlanting,
      isEligible: daysSincePlanting >= 365
    };
  }, [habits, profileCreatedAt]);

  if (!stats.isEligible) {
    const daysRemaining = 365 - stats.daysSincePlanting;
    return (
      <div className="bg-bloom-50/30 rounded-[48px] p-12 border-2 border-dashed border-bloom-100 text-center animate-in fade-in duration-1000">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <span className="text-4xl animate-bounce">🌱</span>
        </div>
        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter mb-2">Yearly Bloom in Progress</h3>
        <p className="text-gray-500 font-medium max-w-sm mx-auto leading-relaxed">
          Your garden needs <span className="text-bloom-600 font-black">{daysRemaining} more days</span> of nurturing before your first Legacy Tree can be harvested.
        </p>
        <div className="mt-8 max-w-xs mx-auto bg-gray-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-bloom-500 h-full transition-all duration-1000" 
            style={{ width: `${(stats.daysSincePlanting / 365) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // The "Legacy Tree" Logic
  const leafCount = Math.min(Math.floor(stats.totalCompletions / 10), 50);
  const flowerCount = Math.min(stats.perfectWeeks, 12);
  const trunkWidth = Math.min(10 + (stats.bestStreak / 10), 30);

  return (
    <div className="bg-white rounded-[56px] p-8 md:p-16 border border-gray-100 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-bloom-50/30 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center">
        <span className="px-4 py-1.5 bg-bloom-500 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-8">
          Year One Legacy
        </span>
        
        <h2 className="text-4xl md:text-7xl font-black text-gray-900 tracking-tighter mb-4 lowercase">
          Your Annual Bloom.
        </h2>
        
        <p className="text-gray-400 font-medium max-w-md mb-16 leading-relaxed">
          This living sculpture is grown from 365 days of discipline, representing {stats.totalCompletions} successful rituals.
        </p>

        {/* Procedural Tree SVG */}
        <div className="relative w-full max-w-lg aspect-square mb-16">
          <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
            {/* Trunk */}
            <path 
              d={`M100,180 Q100,100 100,40`} 
              stroke="#4d3227" 
              strokeWidth={trunkWidth / 2} 
              fill="none" 
              strokeLinecap="round" 
              className="transition-all duration-1000"
            />
            {/* Branches and Leaves */}
            {Array.from({ length: leafCount }).map((_, i) => {
              const angle = (i / leafCount) * Math.PI * 2;
              const radius = 40 + Math.random() * 40;
              const lx = 100 + Math.cos(angle) * radius;
              const ly = 80 + Math.sin(angle) * radius;
              return (
                <g key={i} className="animate-in zoom-in duration-1000" style={{ animationDelay: `${i * 20}ms` }}>
                  <line x1="100" y1="100" x2={lx} y2={ly} stroke="#4d3227" strokeWidth="0.5" opacity="0.3" />
                  <circle cx={lx} cy={ly} r="4" fill={i % 2 === 0 ? '#80b918' : '#afd46f'} />
                </g>
              );
            })}
            {/* Flowers for Perfect Weeks */}
            {Array.from({ length: flowerCount }).map((_, i) => {
              const angle = (i / flowerCount) * Math.PI * 2;
              const fx = 100 + Math.cos(angle) * 70;
              const fy = 80 + Math.sin(angle) * 70;
              return (
                <circle 
                  key={`f-${i}`} 
                  cx={fx} cy={fy} r="6" 
                  fill="#ff758f" 
                  className="animate-pulse shadow-lg"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              );
            })}
          </svg>
          
          {/* Petal Animation Overlay */}
          <div className="absolute inset-0 pointer-events-none">
             <div className="flex justify-around w-full h-full opacity-40">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={`w-2 h-2 bg-pink-200 rounded-full animate-ping`} style={{ animationDuration: `${2+i}s` }} />
                ))}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-3xl">
          <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Total Effort</span>
            <span className="text-3xl font-black text-gray-900">{stats.totalCompletions}</span>
          </div>
          <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Deepest Root</span>
            <span className="text-3xl font-black text-gray-900">{stats.bestStreak}d</span>
          </div>
          <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Golden Cycles</span>
            <span className="text-3xl font-black text-gray-900">{stats.perfectWeeks}</span>
          </div>
          <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Persistence</span>
            <span className="text-3xl font-black text-gray-900">{Math.round((stats.totalCompletions / 365) * 10)}%</span>
          </div>
        </div>

        <button className="mt-16 px-12 py-5 bg-gray-900 text-white rounded-full font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl hover:-translate-y-1 active:scale-95">
          Share My Legacy
        </button>
      </div>
    </div>
  );
};

export default YearlyPlantReport;
