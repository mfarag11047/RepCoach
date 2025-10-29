import React from 'react';
// Fix: Import `Workout` type to be used for type casting.
import type { WorkoutHistory, Workout } from '../types';
import { Calendar, Clock, Weight, Flame } from 'lucide-react';

interface LogbookScreenProps {
    workoutHistory: WorkoutHistory;
}

const LogbookScreen: React.FC<LogbookScreenProps> = ({ workoutHistory }) => {
    // Fix: Cast the result of Object.entries to the correct type to resolve downstream property access errors.
    const historyEntries = Object.entries(workoutHistory).reverse() as [string, Workout][];

    return (
        <div className="p-4">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight">Logbook</h1>
                <p className="text-slate-500 dark:text-dark-text-secondary">Your workout history at a glance.</p>
            </header>

            {historyEntries.length === 0 ? (
                <div className="text-center py-20 animate-fade-in">
                    <Calendar size={48} className="mx-auto text-slate-400 dark:text-dark-text-secondary mb-4" />
                    <p className="text-lg text-slate-500 dark:text-dark-text-secondary">No workouts logged yet.</p>
                    <p className="text-sm text-slate-400 dark:text-dark-text-secondary/70">Complete a workout to see it here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {historyEntries.map(([date, workout]) => (
                        <div key={date} className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg animate-fade-in">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-dark-text-primary mb-3">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm mb-4 pb-4 border-b border-gray-200 dark:border-white/10">
                                <div className="flex items-center gap-2">
                                    <Clock size={18} className="text-brand-primary"/>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">{(workout.totalTime / 60).toFixed(0)} min</div>
                                        <div className="text-xs text-slate-500 dark:text-dark-text-secondary -mt-1 tracking-wider">TIME</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Weight size={18} className="text-brand-secondary"/>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">{workout.totalVolume.toLocaleString()} lbs</div>
                                        <div className="text-xs text-slate-500 dark:text-dark-text-secondary -mt-1 tracking-wider">VOLUME</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Flame size={18} className="text-red-400"/>
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">{workout.calories} kcal</div>
                                        <div className="text-xs text-slate-500 dark:text-dark-text-secondary -mt-1 tracking-wider">CALORIES</div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-500 dark:text-dark-text-secondary mb-2">Exercises:</h4>
                                <ul className="text-sm space-y-1">
                                    {workout.exercises.map(ex => (
                                        <li key={ex.id} className="flex justify-between">
                                            <span>{ex.name}</span>
                                            <span className="text-slate-500 dark:text-dark-text-secondary">{ex.sets.length} sets</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LogbookScreen;