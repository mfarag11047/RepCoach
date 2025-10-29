import React, { useMemo, useState } from 'react';
import type { WorkoutHistory, MuscleRecoveryDetails, GroupedRecoveryStatus } from '../types';
import { ChevronDown } from 'lucide-react';
import { calculateRecoveryPercentage } from '../services/recoveryService';

interface RecoveryScreenProps {
    workoutHistory: WorkoutHistory;
    allMuscleGroups: string[];
}

const getRecoveryColor = (percentage: number): string => {
    if (percentage < 25) return 'from-recovery-fatigued/70 to-recovery-fatigued';
    if (percentage < 75) return 'from-recovery-recovering/70 to-recovery-recovering';
    return 'from-recovery-fresh/70 to-recovery-fresh';
};
const getRecoveryTextColor = (percentage: number): string => {
    if (percentage < 25) return 'text-recovery-fatigued';
    if (percentage < 75) return 'text-recovery-recovering';
    return 'text-recovery-fresh';
}


const MuscleGroupRow: React.FC<{
    name: string;
    details: MuscleRecoveryDetails;
    isExpanded: boolean;
    onToggle: () => void;
}> = ({ name, details, isExpanded, onToggle }) => {
    const hasSubMuscles = details.subMuscles && Object.keys(details.subMuscles).length > 0;
    
    const ProgressBar: React.FC<{ percentage: number }> = ({ percentage }) => (
      <div className="w-full bg-gray-200 dark:bg-dark-surface rounded-full h-2.5">
          <div 
              className={`bg-gradient-to-r ${getRecoveryColor(percentage)} h-2.5 rounded-full transition-all duration-500`}
              style={{ width: `${percentage}%` }}
          ></div>
      </div>
    );

    return (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-white/10 shadow-lg mb-3 overflow-hidden transition-all duration-300 animate-fade-in">
            <div 
                className={`flex items-center justify-between p-4 ${hasSubMuscles ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-surface' : ''}`}
                onClick={hasSubMuscles ? onToggle : undefined}
                aria-expanded={isExpanded}
            >
                <span className="font-semibold text-lg">{name}</span>
                <div className="flex items-center w-1/2">
                    <div className="w-full mr-4">
                        <ProgressBar percentage={details.average} />
                    </div>
                    <span className={`font-bold w-12 text-right ${getRecoveryTextColor(details.average)}`}>{details.average}%</span>
                    {hasSubMuscles && (
                        <ChevronDown 
                            size={20} 
                            className={`ml-2 text-slate-400 dark:text-dark-text-secondary transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                        />
                    )}
                </div>
            </div>
            {hasSubMuscles && isExpanded && (
                <div className="bg-gray-100/50 dark:bg-dark-surface/50 px-4 pb-4 pt-2 border-t border-gray-200 dark:border-white/10">
                    {Object.entries(details.subMuscles!).map(([subMuscle, percentage]) => (
                         <div key={subMuscle} className="flex items-center justify-between py-2">
                             <span className="text-slate-500 dark:text-dark-text-secondary">{subMuscle}</span>
                             <div className="flex items-center w-1/2">
                                 <div className="w-full mr-4">
                                     <ProgressBar percentage={percentage} />
                                 </div>
                                 <span className="font-semibold text-slate-500 dark:text-dark-text-secondary w-12 text-right">{percentage}%</span>
                             </div>
                         </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const RecoveryScreen: React.FC<RecoveryScreenProps> = ({ workoutHistory, allMuscleGroups }) => {
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    
    const recoveryStatus = useMemo(() => calculateRecoveryPercentage(workoutHistory, allMuscleGroups), [workoutHistory, allMuscleGroups]);

    const handleToggle = (groupName: string) => {
        setExpandedGroup(prev => prev === groupName ? null : groupName);
    };

    const { lastWorkoutText, freshMusclesCount } = useMemo(() => {
        let freshCount = 0;
        (Object.values(recoveryStatus) as MuscleRecoveryDetails[]).forEach(group => {
            if (group.average === 100) {
                freshCount++;
            }
        });
        
        const historyEntries = Object.keys(workoutHistory);
        let lastWorkoutStr = "N/A";
        if (historyEntries.length > 0) {
            const lastWorkoutDate = new Date(historyEntries.sort().reverse()[0]);
            const now = new Date();
            const diffHours = (now.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60);
            if (diffHours < 1) {
                lastWorkoutStr = `${Math.floor(diffHours * 60)} min ago`;
            } else if (diffHours < 24) {
                lastWorkoutStr = `${Math.floor(diffHours)}h ago`;
            } else {
                lastWorkoutStr = `${Math.floor(diffHours / 24)}d ago`;
            }
        }
        return { lastWorkoutText: lastWorkoutStr, freshMusclesCount: freshCount };
    }, [workoutHistory, recoveryStatus]);

    return (
        <div className="p-4">
            <header className="mb-4">
                <h1 className="text-3xl font-extrabold tracking-tight">Recovery</h1>
                <p className="text-slate-500 dark:text-dark-text-secondary">Your body's current readiness.</p>
            </header>

            <div className="grid grid-cols-2 gap-4 text-center mb-6 p-4 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-white/10">
                <div>
                    <p className="text-sm tracking-wider text-slate-500 dark:text-dark-text-secondary">LAST WORKOUT</p>
                    <p className="text-2xl font-bold mt-1">{lastWorkoutText}</p>
                </div>
                <div className="border-l border-gray-200 dark:border-white/10">
                    <p className="text-sm tracking-wider text-slate-500 dark:text-dark-text-secondary">FRESH GROUPS</p>
                    <p className="text-2xl font-bold mt-1 text-recovery-fresh">{freshMusclesCount}</p>
                </div>
            </div>
            
            <div>
                {(Object.entries(recoveryStatus) as [string, MuscleRecoveryDetails][]).map(([group, details]) => (
                    <MuscleGroupRow 
                        key={group}
                        name={group}
                        details={details}
                        isExpanded={expandedGroup === group}
                        onToggle={() => handleToggle(group)}
                    />
                ))}
            </div>
        </div>
    );
};

export default RecoveryScreen;