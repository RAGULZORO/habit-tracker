
import React, { useState, useEffect } from 'react';
import { PASTEL_COLORS } from '../constants';
import { Habit } from '../types';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, goal: string, color: string) => void;
  onUpdate: (id: string, name: string, goal: string, color: string) => void;
  habitToEdit: Habit | null;
}

const HabitModal: React.FC<HabitModalProps> = ({ isOpen, onClose, onAdd, onUpdate, habitToEdit }) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [selectedColor, setSelectedColor] = useState(PASTEL_COLORS[0]);

  useEffect(() => {
    if (habitToEdit) {
      setName(habitToEdit.name);
      setGoal(habitToEdit.goal);
      setSelectedColor(habitToEdit.color);
    } else {
      setName('');
      setGoal('');
      setSelectedColor(PASTEL_COLORS[0]);
    }
  }, [habitToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (habitToEdit) {
      onUpdate(habitToEdit.id, name, goal, selectedColor);
    } else {
      onAdd(name, goal, selectedColor);
    }
    
    onClose();
  };

  const isEditMode = !!habitToEdit;

  return (
    <div className="fixed inset-0 z-50 flex items-center md:items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-[32px] md:rounded-[48px] w-full max-w-md p-6 md:p-10 shadow-2xl animate-in fade-in zoom-in duration-300 border border-gray-100">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tighter">
            {isEditMode ? 'Edit Habit' : 'New Habit'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors p-2 bg-gray-50 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Habit Name</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g., Early Morning Yoga"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-bloom-500 outline-none transition-all font-bold text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Daily Goal (optional)</label>
            <input
              type="text"
              placeholder="e.g., 20 minutes"
              className="w-full px-6 py-4 rounded-2xl border-2 border-gray-50 bg-gray-50 text-gray-900 placeholder:text-gray-300 focus:bg-white focus:border-bloom-500 outline-none transition-all font-bold text-sm"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Visual Identity</label>
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center md:justify-start">
              {PASTEL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border-4 transition-all shadow-sm ${color.split(' ')[0]} ${
                    selectedColor === color ? 'border-gray-900 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-5 bg-gray-900 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 mt-4 text-xs md:text-sm"
          >
            {isEditMode ? 'Update Ritual' : 'Plant Habit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HabitModal;
