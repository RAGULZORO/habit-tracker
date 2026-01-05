
import React, { useState, useEffect } from 'react';
import { PASTEL_COLORS, DAYS_OF_WEEK } from '../constants';
import { Habit } from '../types';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, goal: string, color: string, reminderTime?: string, reminderDays?: number[]) => void;
  onUpdate: (id: string, name: string, goal: string, color: string, reminderTime?: string, reminderDays?: number[]) => void;
  habitToEdit: Habit | null;
}

const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, onAdd, onUpdate, habitToEdit }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0]);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [reminderDays, setReminderDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setGoal(habitToEdit.goal);
      setSelectedColor(habitToEdit.color || PASTEL_COLORS[0]);
      setReminderEnabled(!!habitToEdit.reminderTime);
      setReminderTime(habitToEdit.reminderTime || '09:00');
      setReminderDays(habitToEdit.reminderDays || [0, 1, 2, 3, 4, 5, 6]);
    } else {
      setName('');
      setGoal('');
      setSelectedColor(PASTEL_COLORS[0]);
      setReminderEnabled(false);
      setReminderTime('09:00');
      setReminderDays([0, 1, 2, 3, 4, 5, 6]);
    }
    setIsSubmitting(false);
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setReminderDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const finalReminderTime = reminderEnabled ? reminderTime : undefined;
    const finalReminderDays = reminderEnabled ? reminderDays : undefined;

    try {
        if (habitToEdit) {
          await onUpdate(habitToEdit.id, name, goal, selectedColor, finalReminderTime, finalReminderDays);
        } else {
          await onAdd(name, goal, selectedColor, finalReminderTime, finalReminderDays);
        }
    } catch (err) {
        setIsSubmitting(false);
    }
  };

  const isEditMode = !!habitToEdit;

  return (
    <div className="fixed inset-0 z-50 flex items-center md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-[32px] md:rounded-[48px] w-full max-w-md p-6 md:p-10 shadow-2xl animate-in fade-in zoom-in duration-300 border border-gray-100 overflow-y-auto max-h-[90vh] no-scrollbar">
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-white z-10 pb-2">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter">
            {isEditMode ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-2 bg-gray-50 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 pb-2">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Habit Name</label>
            <input
              type="text"
              required
              autoFocus
              disabled={isSubmitting}
              placeholder="e.g., Early Morning Yoga"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-gray-300 outline-none transition-all font-bold text-sm disabled:opacity-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Daily Goal (optional)</label>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder="e.g., 20 minutes"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-gray-300 outline-none transition-all font-bold text-sm disabled:opacity-50"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Visual Identity</label>
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center md:justify-start">
              {PASTEL_COLORS.map((color) => {
                const [bg] = color.split(' ');
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setSelectedColor(color)}
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-4 transition-all shadow-sm ${bg} ${
                      isSelected ? 'border-gray-900 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                    } disabled:cursor-not-allowed`}
                  />
                );
              })}
            </div>
          </div>

          {/* Reminders Section */}
          <div className="pt-4 border-t border-gray-50">
            <div className="flex items-center justify-between mb-4 px-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Reminders</label>
              <button 
                type="button"
                disabled={isSubmitting}
                onClick={() => setReminderEnabled(!reminderEnabled)}
                className={`w-12 h-6 rounded-full transition-all relative ${reminderEnabled ? 'bg-bloom-500' : 'bg-gray-200'} disabled:opacity-50`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${reminderEnabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {reminderEnabled && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <input 
                  type="time" 
                  disabled={isSubmitting}
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-6 py-3 rounded-2xl border-2 border-gray-50 bg-gray-50 font-black text-gray-700 outline-none focus:bg-white focus:border-bloom-500 transition-all text-center text-lg disabled:opacity-50"
                />
                
                <div className="flex justify-between gap-1">
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => toggleDay(idx)}
                      className={`flex-1 aspect-square rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                        reminderDays.includes(idx) 
                          ? 'bg-bloom-50 border-bloom-200 text-bloom-600' 
                          : 'bg-gray-50 border-transparent text-gray-300'
                      } disabled:opacity-50`}
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
            disabled={isSubmitting}
            className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 mt-4 text-xs md:text-sm flex items-center justify-center gap-3 disabled:bg-gray-400 disabled:shadow-none"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Planting...
              </>
            ) : (
              isEditMode ? 'Update Ritual' : 'Plant Habit'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HabitModal;
