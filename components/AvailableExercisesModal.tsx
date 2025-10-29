import React from 'react';
import { X, Dumbbell } from 'lucide-react';
import type { UserProfile, Exercise } from '../types';

interface AvailableExercisesModalProps {
    isOpen: boolean;
    onClose: () => void;
    allExercises: Exercise[];
}

const ExerciseCard: React.FC<{ exercise: Exercise }> = ({ exercise }) => (
    <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
        <h4 className="font-bold text-slate-900 dark:text-dark-text-primary">{exercise.name}</h4>
        <p className="text-sm text-slate-500 dark:text-dark-text-secondary">{exercise.primaryMuscle}</p>
        <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 dark:text-dark-text-secondary/80">
            <Dumbbell size={14} />
            <span>{exercise.equipment}</span>
        </div>
    </div>
);


const AvailableExercisesModal: React.FC<AvailableExercisesModalProps> = ({ isOpen, onClose, allExercises }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" 
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white/90 dark:bg-dark-surface/80 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl w-full max-w-lg m-4 shadow-2xl text-slate-800 dark:text-white max-h-[90vh] flex flex-col animate-pop-in"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/10 flex-shrink-0">
                    <h2 className="text-xl font-bold text-brand-primary">Active Exercise Library</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"><X/></button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 min-h-0">
                    <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-4">
                        This is the current list of exercises Spot will use to generate workouts. If you've uploaded a valid custom exercise JSON, it will be displayed here. Otherwise, this is the default library.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {allExercises.map(ex => (
                            <ExerciseCard key={ex.id} exercise={ex} />
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AvailableExercisesModal;