import React, { useState, useEffect } from 'react';
import { Dumbbell, Loader2, Plus, Repeat, Target, Weight as WeightIcon, X, CheckCircle2 } from 'lucide-react';
import type { WorkoutHistory, UserProfile, LoggedExercise, Set, Workout, PlannedExercise, Tab } from '../types';
import ExerciseDetailModal from '../components/ExerciseDetailModal';

interface WorkoutScreenProps {
    userProfile: UserProfile;
    currentWorkout: PlannedExercise[] | null;
    setCurrentWorkout: React.Dispatch<React.SetStateAction<PlannedExercise[] | null>>;
    isWorkoutActive: boolean;
    setIsWorkoutActive: React.Dispatch<React.SetStateAction<boolean>>;
    workoutStartTime: number | null;
    setWorkoutStartTime: React.Dispatch<React.SetStateAction<number | null>>;
    activeWorkoutLog: LoggedExercise[];
    setActiveWorkoutLog: React.Dispatch<React.SetStateAction<LoggedExercise[]>>;
    setActiveTab: (tab: Tab) => void;
    setWorkoutHistory: React.Dispatch<React.SetStateAction<WorkoutHistory>>;
    isGenerating: boolean;
    generationError: string | null;
    onGenerateWorkout: () => void;
}

const PlannedExerciseCard: React.FC<{ exercise: PlannedExercise; onClick: () => void; }> = ({ exercise, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg mb-4 w-full text-left transition-all duration-300 hover:bg-gray-50 dark:hover:bg-dark-surface hover:border-gray-300 dark:hover:border-white/20 transform hover:-translate-y-1 animate-fade-in"
            aria-label={`View details for ${exercise.name}`}
        >
            <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary">{exercise.name}</h3>
            <p className="text-sm text-slate-500 dark:text-dark-text-secondary">{exercise.primaryMuscle}</p>
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                    <Repeat size={16} className="text-brand-primary" />
                    <div>
                         <p className="font-extrabold text-lg text-slate-900 dark:text-white">{exercise.recommendedSets}</p>
                         <p className="text-sm font-semibold text-slate-500 dark:text-dark-text-secondary -mt-1 tracking-wider">SETS</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Target size={16} className="text-brand-secondary" />
                    <div>
                         <p className="font-extrabold text-lg text-slate-900 dark:text-white">{exercise.recommendedReps}</p>
                         <p className="text-sm font-semibold text-slate-500 dark:text-dark-text-secondary -mt-1 tracking-wider">REPS</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <WeightIcon size={16} className="text-green-400" />
                    <div>
                         <p className="font-bold text-base text-slate-900 dark:text-white">{exercise.recommendedWeight}</p>
                         <p className="text-xs text-slate-500 dark:text-dark-text-secondary -mt-1 tracking-wider">WEIGHT</p>
                    </div>
                </div>
            </div>
        </button>
    );
};

const ActiveExerciseCard: React.FC<{
    exercise: LoggedExercise;
    onUpdateExercise: (exercise: LoggedExercise) => void;
}> = ({ exercise, onUpdateExercise }) => {
    
    const activeSetIndex = exercise.sets.findIndex(s => s.status === 'pending');
    const allSetsLogged = activeSetIndex === -1;

    const handleSetChange = (setIndex: number, field: 'reps' | 'weight', value: string) => {
        const numValue = parseFloat(value) || 0;
        const updatedSets = exercise.sets.map((set, index) => 
            index === setIndex ? { ...set, [field]: numValue } : set
        );
        onUpdateExercise({ ...exercise, sets: updatedSets });
    };

    const handleLogSet = () => {
        if (activeSetIndex === -1) return;
        const updatedSets = exercise.sets.map((set, index) => 
            index === activeSetIndex ? { ...set, status: 'logged' } : set
        );
        onUpdateExercise({ ...exercise, sets: updatedSets });
    };

    const handleAddSet = () => {
        const lastSet = exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1] : { reps: 8, weight: 0, status: 'pending' };
        const newSet: Set = { ...lastSet, status: 'pending' };
        onUpdateExercise({ ...exercise, sets: [...exercise.sets, newSet] });
    };

    const handleDeleteSet = (setIndex: number) => {
        const updatedSets = exercise.sets.filter((_, index) => index !== setIndex);
        onUpdateExercise({ ...exercise, sets: updatedSets });
    };


    return (
        <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg mb-4 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-dark-text-primary">{exercise.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-dark-text-secondary">{exercise.primaryMuscle}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                    <p className="text-xs text-slate-500 dark:text-dark-text-secondary font-semibold tracking-wider">SETS</p>
                    <p className="text-2xl font-bold leading-tight">
                        {exercise.sets.filter(s => s.status === 'logged').length}
                        <span className="text-base text-slate-500 dark:text-dark-text-secondary">/{exercise.sets.length}</span>
                    </p>
                </div>
            </div>
            
            <div className="space-y-2 mb-4">
                {exercise.sets.map((set, index) => {
                    const isLogged = set.status === 'logged';
                    const isHighlighted = index === activeSetIndex;

                    return (
                        <div 
                            key={index}
                            className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-300 ${isHighlighted ? 'bg-slate-100 dark:bg-dark-surface ring-2 ring-brand-primary' : 'bg-slate-100 dark:bg-dark-surface'} ${isLogged ? 'opacity-50' : ''}`}
                        >
                            <div className="flex items-center gap-2 w-20">
                                {isLogged ? <CheckCircle2 size={20} className="text-green-500"/> : <div className="w-5 h-5 border-2 border-slate-400 dark:border-dark-text-secondary rounded-full"></div> }
                                <span className="font-bold text-base">SET {index + 1}</span>
                            </div>

                            <input 
                                type="number" 
                                value={set.reps}
                                onChange={e => handleSetChange(index, 'reps', e.target.value)}
                                className="w-full bg-white dark:bg-dark-bg p-3 text-lg rounded-md text-center font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-slate-100 dark:disabled:bg-dark-surface border border-transparent disabled:border-gray-200 dark:disabled:border-white/5"
                                aria-label={`Reps for set ${index + 1} of ${exercise.name}`}
                                disabled={isLogged}
                            />
                            <span className="text-sm text-slate-500 dark:text-dark-text-secondary">reps</span>
                            <input 
                                type="number" 
                                value={set.weight}
                                onChange={e => handleSetChange(index, 'weight', e.target.value)}
                                className="w-full bg-white dark:bg-dark-bg p-3 text-lg rounded-md text-center font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:bg-slate-100 dark:disabled:bg-dark-surface border border-transparent disabled:border-gray-200 dark:disabled:border-white/5" 
                                aria-label={`Weight for set ${index + 1} of ${exercise.name}`}
                                disabled={isLogged}
                            />
                            <span className="text-sm text-slate-500 dark:text-dark-text-secondary">lbs</span>
                             <button 
                                onClick={() => handleDeleteSet(index)} 
                                className="text-slate-400 dark:text-dark-text-secondary hover:text-recovery-fatigued p-1 disabled:opacity-30 transition-colors"
                                aria-label={`Delete set ${index + 1}`}
                                disabled={isLogged}
                             >
                                <X size={16}/>
                             </button>
                        </div>
                    )
                })}
            </div>

            <div className="flex items-center gap-4">
                 <button 
                    onClick={handleLogSet}
                    disabled={allSetsLogged}
                    className="w-full bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-glow-primary transition-all duration-300 transform hover:scale-105 disabled:bg-none disabled:bg-gray-600 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed"
                >
                    {allSetsLogged ? 'All Sets Logged!' : `Log Set ${activeSetIndex + 1}`}
                </button>
                 <button 
                    onClick={handleAddSet}
                    className="bg-slate-100 dark:bg-dark-surface text-slate-800 dark:text-white font-bold p-3 rounded-lg aspect-square flex items-center justify-center border border-gray-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    aria-label={`Add a set for ${exercise.name}`}
                >
                    <Plus size={20}/>
                </button>
            </div>
        </div>
    );
};


const WorkoutScreen: React.FC<WorkoutScreenProps> = (props) => {
    const { 
        userProfile, currentWorkout, setCurrentWorkout,
        isWorkoutActive, setIsWorkoutActive, workoutStartTime, setWorkoutStartTime,
        activeWorkoutLog, setActiveWorkoutLog, setActiveTab, setWorkoutHistory,
        isGenerating, generationError, onGenerateWorkout
    } = props;

    const [elapsedTime, setElapsedTime] = useState(0);
    const [selectedExercise, setSelectedExercise] = useState<PlannedExercise | null>(null);

    useEffect(() => {
        if (isWorkoutActive && workoutStartTime) {
            const timer = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - workoutStartTime) / 1000));
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isWorkoutActive, workoutStartTime]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    };

    const handleStartWorkout = () => {
        if (!currentWorkout) return;
        setIsWorkoutActive(true);
        setWorkoutStartTime(Date.now());
        
        const initialLog: LoggedExercise[] = currentWorkout.map(ex => {
            const recommendedSets = ex.recommendedSets || 3;
            const reps = parseInt(ex.recommendedReps?.match(/\d+/)?.[0] || '8', 10);
            const weight = parseFloat(ex.recommendedWeight?.match(/\d+(\.\d+)?/)?.[0] || '0');

            const initialSets: Set[] = Array.from({ length: recommendedSets }, () => ({
                reps,
                weight,
                status: 'pending'
            }));

            return { 
                ...ex,
                sets: initialSets 
            };
        });
        setActiveWorkoutLog(initialLog);
    };
    
    const handleUpdateActiveExercise = (updatedExercise: LoggedExercise) => {
        setActiveWorkoutLog(prevLog => 
            prevLog.map(ex => ex.id === updatedExercise.id ? updatedExercise : ex)
        );
    };

    const handleFinishWorkout = () => {
        const totalTime = elapsedTime;
        
        // Finalize sets: only include sets that were actually logged
        const finalLoggedExercises = activeWorkoutLog.map(ex => ({
            ...ex,
            sets: ex.sets.filter(s => s.status === 'logged')
        })).filter(ex => ex.sets.length > 0);

        if (finalLoggedExercises.length === 0) {
            // Discard empty workout
            setIsWorkoutActive(false);
            setWorkoutStartTime(null);
            setCurrentWorkout(null);
            setActiveWorkoutLog([]);
            return;
        }

        const totalVolume = finalLoggedExercises.reduce((totalVol, ex) => 
            totalVol + ex.sets.reduce((exVol, set) => exVol + (set.reps * set.weight), 0)
        , 0);
        const calories = Math.round(totalVolume / 50);

        const newWorkout: Workout = {
            totalTime,
            totalVolume,
            calories,
            exercises: finalLoggedExercises
        };

        const workoutDate = new Date().toISOString();
        setWorkoutHistory(prev => ({ ...prev, [workoutDate]: newWorkout }));

        // Reset state
        setIsWorkoutActive(false);
        setWorkoutStartTime(null);
        setCurrentWorkout(null);
        setActiveWorkoutLog([]);
        setElapsedTime(0);

        // Switch to the logbook tab to show the user their saved workout
        setActiveTab('logbook');
    };

    if (isWorkoutActive) {
        return (
            <div className="p-4">
                <header className="mb-6 sticky top-0 bg-slate-50/80 dark:bg-dark-bg/80 backdrop-blur-sm py-4 z-10 -mx-4 px-4 border-b border-gray-200 dark:border-white/10">
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-extrabold">Workout Active</h1>
                        <div className="text-2xl font-mono bg-white dark:bg-dark-surface px-4 py-2 rounded-lg border border-gray-200 dark:border-white/10">{formatTime(elapsedTime)}</div>
                    </div>
                </header>
                
                <div>
                    {activeWorkoutLog.map(exercise => (
                        <ActiveExerciseCard 
                            key={exercise.id} 
                            exercise={exercise}
                            onUpdateExercise={handleUpdateActiveExercise}
                        />
                    ))}
                </div>

                <button
                    onClick={handleFinishWorkout}
                    className="w-full bg-recovery-fatigued text-white font-bold py-3 px-4 rounded-lg mt-6 transition-transform transform hover:scale-105 shadow-lg"
                >
                    Finish Workout
                </button>
            </div>
        )
    }

    return (
        <div className="p-4">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight">Today's Workout</h1>
                <p className="text-slate-500 dark:text-dark-text-secondary">Ready to crush your goals, {userProfile.name}?</p>
            </header>
            
            {currentWorkout ? (
                <div>
                    {currentWorkout.map(exercise => (
                       <PlannedExerciseCard 
                           key={exercise.id} 
                           exercise={exercise}
                           onClick={() => setSelectedExercise(exercise)}
                       />
                    ))}
                    <button 
                        onClick={handleStartWorkout}
                        className="w-full bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to text-white font-bold py-3 px-4 rounded-lg mt-4 shadow-lg hover:shadow-glow-primary transition-all duration-300 transform hover:scale-105"
                    >
                        Start Workout
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center">
                    <Dumbbell size={64} className="text-brand-primary mb-4" />
                    <h2 className="text-2xl font-bold mb-2">
                        {isGenerating ? "Generating Your Workout..." : "Your AI-Powered Plan Awaits"}
                    </h2>
                    <p className="text-slate-500 dark:text-dark-text-secondary mb-6 max-w-sm">
                        {isGenerating 
                            ? "Spot is analyzing your profile and its knowledge base..." 
                            : "Tap the button to create your personalized plan for today."}
                    </p>
                    {generationError && <p className="text-red-500 text-sm mb-4">{generationError}</p>}
                    <button 
                        onClick={onGenerateWorkout}
                        disabled={isGenerating}
                        className="bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-glow-primary transition-all duration-300 transform hover:scale-105 flex items-center justify-center disabled:bg-none disabled:bg-gray-600 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader2 className="animate-spin mr-2" /> : null}
                        {isGenerating ? "Please Wait" : "Generate Today's Workout"}
                    </button>
                </div>
            )}
             <ExerciseDetailModal
                isOpen={!!selectedExercise}
                exercise={selectedExercise}
                onClose={() => setSelectedExercise(null)}
            />
        </div>
    );
};

export default WorkoutScreen;