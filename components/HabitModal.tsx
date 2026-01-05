
import React, { useState, useEffect } from 'react';
import { PASTEL_COLORS, DAYS_OF_WEEK } from '../constants';
import { Habit } from '../types';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, goal: string, color: string, reminderTime?: string, reminderDays?: number[], targetValue?: number, unit?: string) => Promise<void>;
  onUpdate: (id: string, name: string, goal: string, color: string, reminderTime?: string, reminderDays?: number[], targetValue?: number, unit?: string) => Promise<void>;
  habitToEdit: Habit | null;
  onDelete?: () => void;
}

const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, onAdd, onUpdate, habitToEdit, onDelete }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0]);
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [reminderDays, setReminderDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [submitting, setSubmitting] = useState(false);
  
  // Measurable goal states
  const [isMeasurable, setIsMeasurable] = useState(false);
  const [targetValue, setTargetValue] = useState<number>(1);
  const [unit, setUnit] = useState('times');

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setGoal(habitToEdit.goal);
      setSelectedColor(habitToEdit.color || PASTEL_COLORS[0]);
      setEnableReminder(!!habitToEdit.reminderTime);
      setReminderTime(habitToEdit.reminderTime || '08:00');
      setReminderDays(habitToEdit.reminderDays || [0, 1, 2, 3, 4, 5, 6]);
      setIsMeasurable(!!habitToEdit.targetValue);
      setTargetValue(habitToEdit.targetValue || 1);
      setUnit(habitToEdit.unit || 'times');
    } else {
      setName('');
      setGoal('');
      setSelectedColor(PASTEL_COLORS[0]);
      setEnableReminder(false);
      setReminderTime('08:00');
      setReminderDays([0, 1, 2, 3, 4, 5, 6]);
      setIsMeasurable(false);
      setTargetValue(1);
      setUnit('times');
    }
    setSubmitting(false);
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (dayIndex: number) => {
    setReminderDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    
    setSubmitting(true);
    const finalReminderTime = enableReminder ? reminderTime : undefined;
    const finalReminderDays = enableReminder ? reminderDays : undefined;
    const finalTarget = isMeasurable ? targetValue : undefined;
    const finalUnit = isMeasurable ? unit : undefined;

    try {
      if (habitToEdit) {
        await onUpdate(habitToEdit.id, name, goal, selectedColor, finalReminderTime, finalReminderDays, finalTarget, finalUnit);
      } else {
        await onAdd(name, goal, selectedColor, finalReminderTime, finalReminderDays, finalTarget, finalUnit);
      }
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            {habitToEdit ? 'Edit Ritual' : 'New Ritual'}
          </h2>
          <button onClick={onClose} disabled={submitting} className="p-2 bg-gray-50 rounded-xl hover:text-red-500 transition-colors disabled:opacity-30">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Identity</label>
             <input
              autoFocus
              required
              disabled={submitting}
              placeholder="e.g., Hydration"
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-bloom-500 outline-none font-bold transition-all disabled:opacity-50"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="p-6 bg-gray-50 rounded-3xl space-y-4 border border-gray-100">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <span className="text-lg">🎯</span>
                 <label className="text-xs font-black uppercase tracking-widest text-gray-500">Measurable Goal</label>
               </div>
               <button 
                type="button"
                disabled={submitting}
                onClick={() => setIsMeasurable(!isMeasurable)}
                className={`w-12 h-6 rounded-full transition-all relative ${isMeasurable ? 'bg-bloom-500' : 'bg-gray-200'} disabled:opacity-30`}
               >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isMeasurable ? 'left-7' : 'left-1'}`} />
               </button>
            </div>

            {isMeasurable ? (
              <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-300">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-2">Target</span>
                  <input 
                    type="number"
                    min="1"
                    disabled={submitting}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-100 font-bold outline-none focus:border-bloom-500 disabled:opacity-50"
                    value={targetValue}
                    onChange={e => setTargetValue(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block ml-2">Unit</span>
                  <input 
                    type="text"
                    disabled={submitting}
                    placeholder="e.g., glasses"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-100 font-bold outline-none focus:border-bloom-500 disabled:opacity-50"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <input
                disabled={submitting}
                placeholder="Brief goal (e.g. 20 mins daily)"
                className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-100 outline-none font-bold text-sm disabled:opacity-50"
                value={goal}
                onChange={e => setGoal(e.target.value)}
              />
            )}
          </div>
          
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Ritual Color</label>
            <div className="flex flex-wrap gap-3 justify-center">
              {PASTEL_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  disabled={submitting}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-xl border-4 transition-all ${color.split(' ')[0]} ${
                    selectedColor === color ? 'border-gray-900 scale-110 shadow-md' : 'border-transparent opacity-60'
                  } disabled:opacity-30`}
                />
              ))}
            </div>
          </div>

          <div className="p-6 bg-bloom-50/50 rounded-3xl border border-bloom-100 space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <span className="text-lg">🔔</span>
                 <label className="text-xs font-black uppercase tracking-widest text-bloom-700">Reminders</label>
               </div>
               <button 
                type="button"
                disabled={submitting}
                onClick={() => setEnableReminder(!enableReminder)}
                className={`w-12 h-6 rounded-full transition-all relative ${enableReminder ? 'bg-bloom-500' : 'bg-gray-200'} disabled:opacity-30`}
               >
                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enableReminder ? 'left-7' : 'left-1'}`} />
               </button>
            </div>

            {enableReminder && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-bloom-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Daily At</span>
                  <input 
                    type="time" 
                    disabled={submitting}
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="bg-transparent font-black text-bloom-600 outline-none disabled:opacity-50"
                  />
                </div>
                
                <div className="flex justify-between gap-1">
                  {DAYS_OF_WEEK.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      disabled={submitting}
                      onClick={() => toggleDay(i)}
                      className={`w-8 h-8 rounded-lg text-[9px] font-black transition-all border ${
                        reminderDays.includes(i) 
                          ? 'bg-bloom-500 border-bloom-400 text-white shadow-sm' 
                          : 'bg-white border-gray-100 text-gray-300'
                      } disabled:opacity-30`}
                    >
                      {day[0]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Planting...
              </>
            ) : (
              habitToEdit ? 'Update Garden' : 'Plant Habit'
            )}
          </button>

          {habitToEdit && onDelete && (
            <button 
              type="button" 
              disabled={submitting}
              onClick={onDelete} 
              className="w-full py-3 text-red-400 font-bold text-xs uppercase tracking-widest hover:text-red-600 transition-colors disabled:opacity-30"
            >
              Uproot Ritual
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default HabitModal;
