import type { WorkoutHistory, GroupedRecoveryStatus } from '../types';

const MUSCLE_HIERARCHY: { [major: string]: string[] | null } = {
    'Chest': null,
    'Back': null,
    'Shoulders': null,
    'Arms': ['Biceps', 'Triceps', 'Forearms'],
    'Legs': ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
};

export const calculateRecoveryPercentage = (workoutHistory: WorkoutHistory, allMuscleGroups: string[]): GroupedRecoveryStatus => {
    const now = new Date().getTime();
    
    // Step 1: More efficiently find the most recent workout time for each muscle.
    const lastWorkoutTimeMap: { [muscle: string]: number } = {};
    
    // Get history entries and sort them from newest to oldest.
    const sortedHistory = Object.entries(workoutHistory).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

    for (const [dateStr, workout] of sortedHistory) {
        const workoutDate = new Date(dateStr).getTime();
        for (const exercise of workout.exercises) {
            // Combine primary and secondary muscles for the exercise
            const musclesWorked = [exercise.primaryMuscle, ...exercise.secondaryMuscles];
            for (const muscle of musclesWorked) {
                if (muscle && !lastWorkoutTimeMap[muscle]) {
                    // If we haven't recorded a time for this muscle yet, this is its most recent workout.
                    lastWorkoutTimeMap[muscle] = workoutDate;
                }
            }
        }
    }

    // Step 2: Calculate recovery percentage for each individual muscle based on the map.
    const individualStatus: { [muscle: string]: number } = {};
    allMuscleGroups.forEach(muscle => {
        const mostRecentWorkout = lastWorkoutTimeMap[muscle];

        if (!mostRecentWorkout) {
            individualStatus[muscle] = 100; // Never worked
            return;
        }

        const hoursAgo = (now - mostRecentWorkout) / (1000 * 60 * 60);
        
        let percentage = 0;
        if (hoursAgo >= 72) {
            percentage = 100;
        } else if (hoursAgo >= 24) {
            // Recovers from 25% to 100% between 24 and 72 hours
            percentage = 25 + ((hoursAgo - 24) / 48) * 75;
        } else {
            // Recovers from 0% to 25% in the first 24 hours
            percentage = (hoursAgo / 24) * 25;
        }
        individualStatus[muscle] = Math.round(percentage);
    });

    // Step 3: Group the muscles according to the hierarchy.
    const groupedStatus: GroupedRecoveryStatus = {};
    for (const [majorGroup, subMuscles] of Object.entries(MUSCLE_HIERARCHY)) {
        if (subMuscles) { // It's a group with sub-muscles (e.g., Arms)
            const subMuscleDetails: { [name: string]: number } = {};
            let total = 0;
            let count = 0;

            subMuscles.forEach(subMuscle => {
                if (individualStatus.hasOwnProperty(subMuscle)) {
                    subMuscleDetails[subMuscle] = individualStatus[subMuscle];
                    total += individualStatus[subMuscle];
                    count++;
                }
            });

            if (count > 0) {
                 groupedStatus[majorGroup] = {
                    average: Math.round(total / count),
                    subMuscles: subMuscleDetails,
                };
            }
        } else { // It's a standalone major muscle (e.g., Chest)
            if (individualStatus.hasOwnProperty(majorGroup)) {
                groupedStatus[majorGroup] = {
                    average: individualStatus[majorGroup]
                };
            }
        }
    }
    
    // Sort for consistent order
    const orderedGroupedStatus: GroupedRecoveryStatus = {};
    Object.keys(MUSCLE_HIERARCHY).forEach(key => {
        if(groupedStatus[key]) {
            orderedGroupedStatus[key] = groupedStatus[key];
        }
    });

    return orderedGroupedStatus;
};