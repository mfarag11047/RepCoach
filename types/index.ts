

// Fix: Removed circular import of 'Tab' from its own file.
export type Tab = 'workout' | 'logbook' | 'recovery' | 'progress' | 'ai' | 'preferences';

// Fix: Escaped the single quote in "Gold's Gym" to create a valid string literal for the type union.
export type GymBrand = 'Planet Fitness' | 'LA Fitness' | 'Anytime Fitness' | '24 Hour Fitness' | 'Gold\'s Gym' | 'Other';

export interface UserProfile {
  name: string;
  gender: 'Male' | 'Female';
  height: number; // inches
  weight: number; // lbs
  goal: 'Build Muscle' | 'Lose Weight' | 'Gain Strength';
  experience: 'Beginner' | 'Intermediate' | 'Advanced';
  frequency: number;
  workoutSplit: 'Push/Pull/Legs' | 'Full Body' | 'Upper/Lower' | 'Body Part Split';
  trainingStyle: 'Strength Training' | 'Hypertrophy' | 'Circuit Training' | 'General Fitness' | 'Powerlifting' | 'Olympic Weightlifting';
  gym: GymBrand | null;
  autoGenerateTime: string | null; // e.g., "17:30"
  workoutDuration: number | null; // in minutes
}

export interface Set {
  reps: number;
  weight: number;
  status: 'pending' | 'logged';
}

export interface Exercise {
  id: string;
  name: string;
  description: string;
  videoUrl: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string;
  type: string;
  isUserAdded: boolean;
}

export interface PlannedExercise extends Exercise {
    recommendedSets: number;
    recommendedReps: string; // e.g., "8-12" or "5"
    recommendedWeight: string; // e.g., "135 lbs" or "RPE 7"
}

export interface LoggedExercise extends Exercise {
    sets: Set[];
    recommendedSets?: number;
    recommendedReps?: string;
    recommendedWeight?: string;
}

export interface Workout {
    totalTime: number; // in seconds
    totalVolume: number; // in lbs
    calories: number;
    exercises: LoggedExercise[];
}

export interface WorkoutHistory {
    [date: string]: Workout;
}

export type RecoveryState = 'fresh' | 'recovering' | 'fatigued';

export interface MuscleRecoveryStatus {
    [muscle: string]: RecoveryState;
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text?: string;
    isLoading?: boolean;
    isConfirmation?: boolean;
    data?: any;
}

// Added for Recovery Service
export interface MuscleRecoveryDetails {
    average: number;
    subMuscles?: { [name: string]: number };
}

export type GroupedRecoveryStatus = {
    [group: string]: MuscleRecoveryDetails;
};