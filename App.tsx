import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Dumbbell, BookOpen, HeartPulse, LineChart, SlidersHorizontal, Camera, Check, Loader2, RefreshCw, X, Upload } from 'lucide-react';
import BottomNav from './components/BottomNav';
import WorkoutScreen from './screens/WorkoutScreen';
import LogbookScreen from './screens/LogbookScreen';
import RecoveryScreen from './screens/RecoveryScreen';
import ProgressScreen from './screens/ProgressScreen';
import PreferencesScreen from './screens/PreferencesScreen';
import FloatingAIChatBubble from './components/FloatingAIChatBubble';
import AIChatModal from './components/AIChatModal';
import { identifyMachineFromImage, sendNewMachineEmail, generateWorkoutFromKnowledge } from './services/geminiService';
import { calculateRecoveryPercentage } from './services/recoveryService';
import { EXERCISES_DATA } from './data/exercises';
import type { Tab, UserProfile, Exercise, WorkoutHistory, LoggedExercise, PlannedExercise, GymBrand } from './types';
import AvailableExercisesModal from './components/AvailableExercisesModal';

// --- CameraModal Component Definition ---
interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    exercises: Exercise[];
    onMachineIdentified: (machineName: string) => void;
    onMachineNotFound: (machineName: string, imageBase64: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, exercises, onMachineIdentified, onMachineNotFound }) => {
    type Status = 'STREAMING' | 'PREVIEW' | 'ANALYZING' | 'SUCCESS' | 'NOT_FOUND' | 'ERROR';
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [status, setStatus] = useState<Status>('STREAMING');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [resultMessage, setResultMessage] = useState('');

    useEffect(() => {
        const startStream = async () => {
            if (isOpen && status === 'STREAMING') {
                try {
                    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                    setStream(mediaStream);
                    if (videoRef.current) {
                        videoRef.current.srcObject = mediaStream;
                    }
                } catch (err) {
                    console.error("Error accessing camera:", err);
                    setStatus('ERROR');
                    setResultMessage('Could not access the camera. Please check permissions.');
                }
            }
        };

        const stopStream = () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                setStream(null);
            }
        };

        if (isOpen) {
            startStream();
        } else {
            stopStream();
            // Reset state when closing
            setTimeout(() => {
                setStatus('STREAMING');
                setCapturedImage(null);
                setResultMessage('');
            }, 300); // delay to allow for closing animation
        }

        return () => stopStream();
    }, [isOpen, status]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setCapturedImage(dataUrl);
            setStatus('PREVIEW');
        }
    };

    const handleAnalyze = async () => {
        if (!capturedImage) return;
        setStatus('ANALYZING');
        try {
            const identifiedName = await identifyMachineFromImage(capturedImage);
            const machineNameLower = identifiedName.toLowerCase();

            const isKnown = exercises.some(ex => 
                ex.name.toLowerCase().includes(machineNameLower) || 
                ex.equipment.toLowerCase().includes(machineNameLower)
            );

            if (isKnown) {
                onMachineIdentified(identifiedName);
                setStatus('SUCCESS');
                setResultMessage(`Success! Spot now knows you have a ${identifiedName}. It will be prioritized when generating workouts.`);
            } else {
                onMachineNotFound(identifiedName, capturedImage);
                setStatus('NOT_FOUND');
                setResultMessage(`We've identified this as a "${identifiedName}". It's new to us, but we've notified our team to add it soon!`);
            }
        } catch (err: any) {
            setStatus('ERROR');
            setResultMessage(err.message || 'An unknown error occurred during analysis.');
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in" onClick={onClose}>
            <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl w-full max-w-md m-4 p-4 shadow-2xl text-slate-900 dark:text-white animate-pop-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Camera className="text-brand-primary"/> Scan Machine</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"><X/></button>
                </div>
                
                <p className="text-sm text-center text-slate-500 dark:text-dark-text-secondary mb-4">
                    Scan a machine to let Spot know it's available at your gym. It will be prioritized when generating future workouts.
                </p>

                <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 dark:border-white/10">
                    {status === 'STREAMING' && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>}
                    {status === 'PREVIEW' && <img src={capturedImage!} alt="Captured machine" className="w-full h-full object-cover"/>}
                    {['ANALYZING', 'SUCCESS', 'NOT_FOUND', 'ERROR'].includes(status) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-4 text-center">
                            {status === 'ANALYZING' && <Loader2 size={48} className="animate-spin text-brand-primary mb-4"/>}
                            {status === 'SUCCESS' && <Check size={48} className="text-brand-secondary mb-4"/>}
                            {status === 'NOT_FOUND' && <Upload size={48} className="text-recovery-recovering mb-4"/>}
                            {status === 'ERROR' && <X size={48} className="text-recovery-fatigued mb-4"/>}
                            <p className="font-semibold text-white">{resultMessage}</p>
                        </div>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden"></canvas>
                
                <div className="mt-6">
                    {status === 'STREAMING' && (
                        <button onClick={handleCapture} className="w-full bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-glow-primary transition-all duration-300 transform hover:scale-105">
                            <Camera/> Capture Image
                        </button>
                    )}
                     {status === 'PREVIEW' && (
                        <div className="flex gap-4">
                            <button onClick={() => setStatus('STREAMING')} className="w-full bg-gray-100 dark:bg-dark-surface font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                                <RefreshCw/> Retake
                            </button>
                            <button onClick={handleAnalyze} className="w-full bg-brand-secondary text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-glow-secondary transition-all duration-300 transform hover:scale-105">
                                <Check/> Confirm
                            </button>
                        </div>
                    )}
                    {['SUCCESS', 'NOT_FOUND', 'ERROR'].includes(status) && (
                        <button onClick={onClose} className="w-full bg-gray-100 dark:bg-dark-surface font-bold py-3 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- Mock Data ---
const MOCK_USER_PROFILE: UserProfile = {
  name: 'Alex',
  gender: 'Male',
  height: 70, // inches
  weight: 185, // lbs
  goal: 'Build Muscle',
  experience: 'Intermediate',
  frequency: 4,
  workoutSplit: 'Push/Pull/Legs',
  trainingStyle: 'Hypertrophy',
  gym: null,
  autoGenerateTime: null,
  workoutDuration: 45,
};

const MOCK_WORKOUT_HISTORY: WorkoutHistory = {};

// --- App Component ---
const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('workout');
    const [userProfile, setUserProfile] = useState<UserProfile>(MOCK_USER_PROFILE);
    const [exercises, setExercises] = useState<Exercise[]>(EXERCISES_DATA);
    const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory>(MOCK_WORKOUT_HISTORY);
    const [workoutKnowledge, setWorkoutKnowledge] = useState<string | null>(null);
    const [knowledgeFilePreview, setKnowledgeFilePreview] = useState<string | null>(null);
    const [currentWorkout, setCurrentWorkout] = useState<PlannedExercise[] | null>(null);
    const [workoutReportImages, setWorkoutReportImages] = useState<string[]>([]);
    
    // State for active workout session
    const [isWorkoutActive, setIsWorkoutActive] = useState(false);
    const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);
    const [activeWorkoutLog, setActiveWorkoutLog] = useState<LoggedExercise[]>([]);

    // State for AI Features
    const [isAIChatOpen, setIsAIChatOpen] = useState(false);
    const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
    const [isExercisesModalOpen, setIsExercisesModalOpen] = useState(false);
    const [userAddedEquipment, setUserAddedEquipment] = useState<string[]>([]);
    const [gymEquipmentConstraints, setGymEquipmentConstraints] = useState<string>('');
    const [dislikedExercises, setDislikedExercises] = useState<string[]>([]);
    const [isKnowledgeApplied, setIsKnowledgeApplied] = useState(false);
    
    // State for workout generation
    const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);

    // State for auto-generation
    const [lastAutoGeneratedDate, setLastAutoGeneratedDate] = useState<string | null>(null);

    // State for theme
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
        }
        return 'dark'; // default to dark
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleClearKnowledge = useCallback(() => {
        setWorkoutKnowledge(null);
        setKnowledgeFilePreview(null);
        setExercises(EXERCISES_DATA);
        setIsKnowledgeApplied(false);
    }, []);

    const handleKnowledgeUpload = useCallback((file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setWorkoutKnowledge(text);

            try {
                const parsedJson = JSON.parse(text);
                if (Array.isArray(parsedJson) && parsedJson.length > 0 && 'id' in parsedJson[0] && 'name' in parsedJson[0] && 'primaryMuscle' in parsedJson[0]) {
                    setExercises(parsedJson as Exercise[]);
                    setIsKnowledgeApplied(true);
                    setKnowledgeFilePreview(JSON.stringify(parsedJson, null, 2));
                } else {
                    throw new Error("JSON is not a valid exercise array.");
                }
            } catch (error) {
                setExercises(EXERCISES_DATA);
                setIsKnowledgeApplied(false);
                const lineCount = text.split('\n').length;
                const previewText = text.split('\n').slice(0, 10).join('\n');
                setKnowledgeFilePreview(previewText + (lineCount > 10 ? '\n...' : ''));
            }
        };
        reader.readAsText(file);
    }, []);


    const navItems = [
        { id: 'workout' as Tab, label: 'Workout', icon: Dumbbell },
        { id: 'logbook' as Tab, label: 'Logbook', icon: BookOpen },
        { id: 'recovery' as Tab, label: 'Recovery', icon: HeartPulse },
        { id: 'progress' as Tab, label: 'Progress', icon: LineChart },
        { id: 'preferences' as Tab, label: 'Prefs', icon: SlidersHorizontal },
    ];
    
    const allMuscleGroups = useMemo(() => {
        const muscleSet = new Set<string>();
        exercises.forEach(ex => {
            muscleSet.add(ex.primaryMuscle);
            ex.secondaryMuscles.forEach(m => muscleSet.add(m));
        });
        return Array.from(muscleSet);
    }, [exercises]);

    const handleGenerateWorkout = useCallback(async () => {
        if (!workoutKnowledge) {
            setGenerationError("Please upload a workout knowledge file on the Preferences tab first.");
            return;
        }
        setIsGeneratingWorkout(true);
        setGenerationError(null);
        setCurrentWorkout(null);

        try {
            const recoveryStatus = calculateRecoveryPercentage(workoutHistory, allMuscleGroups);
            const workoutPlan = await generateWorkoutFromKnowledge(
                userProfile,
                workoutKnowledge,
                exercises,
                workoutHistory,
                recoveryStatus,
                workoutReportImages,
                gymEquipmentConstraints,
                dislikedExercises,
                userAddedEquipment
            );

            const plannedExercises: PlannedExercise[] = workoutPlan
                .map(planItem => {
                    const exerciseDetails = exercises.find(ex => ex.id === planItem.exerciseId);
                    if (!exerciseDetails) return null;
                    return {
                        ...exerciseDetails,
                        recommendedSets: planItem.sets,
                        recommendedReps: planItem.reps,
                        recommendedWeight: planItem.recommendedWeight,
                    };
                })
                .filter((ex): ex is PlannedExercise => ex !== null);

            if (plannedExercises.length === 0) {
                 throw new Error("The AI didn't return any valid exercises from your library.");
            }
            setCurrentWorkout(plannedExercises);

        } catch (err: any) {
            setGenerationError(err.message || "An unknown error occurred during workout generation.");
        } finally {
            setIsGeneratingWorkout(false);
        }
    }, [
        workoutKnowledge, userProfile, exercises, workoutHistory, allMuscleGroups,
        workoutReportImages, gymEquipmentConstraints, dislikedExercises, userAddedEquipment
    ]);

    useEffect(() => {
        const timer = setInterval(() => {
            if (!userProfile.autoGenerateTime || isGeneratingWorkout || currentWorkout) {
                return;
            }

            const now = new Date();
            const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
            const currentTime = now.toTimeString().substring(0, 5); // HH:mm

            if (currentTime === userProfile.autoGenerateTime && currentDate !== lastAutoGeneratedDate) {
                console.log(`AUTO-GEN: Triggering workout generation for ${currentDate} at ${currentTime}.`);
                handleGenerateWorkout();
                setLastAutoGeneratedDate(currentDate);
            }
        }, 60000); // Check every minute

        return () => clearInterval(timer);
    }, [userProfile.autoGenerateTime, lastAutoGeneratedDate, isGeneratingWorkout, currentWorkout, handleGenerateWorkout]);

    const renderScreen = () => {
        switch (activeTab) {
            case 'workout':
                return <WorkoutScreen 
                    userProfile={userProfile} 
                    currentWorkout={currentWorkout}
                    setCurrentWorkout={setCurrentWorkout}
                    isWorkoutActive={isWorkoutActive}
                    setIsWorkoutActive={setIsWorkoutActive}
                    workoutStartTime={workoutStartTime}
                    setWorkoutStartTime={setWorkoutStartTime}
                    activeWorkoutLog={activeWorkoutLog}
                    setActiveWorkoutLog={setActiveWorkoutLog}
                    setActiveTab={setActiveTab}
                    setWorkoutHistory={setWorkoutHistory}
                    isGenerating={isGeneratingWorkout}
                    generationError={generationError}
                    onGenerateWorkout={handleGenerateWorkout}
                />;
            case 'logbook':
                return <LogbookScreen workoutHistory={workoutHistory} />;
            case 'recovery':
                return <RecoveryScreen workoutHistory={workoutHistory} allMuscleGroups={allMuscleGroups} />;
            case 'progress':
                return <ProgressScreen workoutHistory={workoutHistory} />;
            case 'preferences':
                return <PreferencesScreen 
                    userProfile={userProfile} 
                    setUserProfile={setUserProfile} 
                    workoutReportImages={workoutReportImages}
                    setWorkoutReportImages={setWorkoutReportImages}
                    workoutKnowledge={workoutKnowledge}
                    knowledgeFilePreview={knowledgeFilePreview}
                    isKnowledgeApplied={isKnowledgeApplied}
                    onKnowledgeUpload={handleKnowledgeUpload}
                    onClearKnowledge={handleClearKnowledge}
                    theme={theme}
                    setTheme={setTheme}
                    onViewExercises={() => setIsExercisesModalOpen(true)}
                />;
            default:
                 return <WorkoutScreen 
                    userProfile={userProfile} 
                    currentWorkout={currentWorkout}
                    setCurrentWorkout={setCurrentWorkout}
                    isWorkoutActive={isWorkoutActive}
                    setIsWorkoutActive={setIsWorkoutActive}
                    workoutStartTime={workoutStartTime}
                    setWorkoutStartTime={setWorkoutStartTime}
                    activeWorkoutLog={activeWorkoutLog}
                    setActiveWorkoutLog={setActiveWorkoutLog}
                    setActiveTab={setActiveTab}
                    setWorkoutHistory={setWorkoutHistory}
                    isGenerating={isGeneratingWorkout}
                    generationError={generationError}
                    onGenerateWorkout={handleGenerateWorkout}
                />;
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-dark-bg min-h-screen text-slate-900 dark:text-dark-text-primary font-sans">
            <main className="pb-24">
                {renderScreen()}
            </main>
            <CameraModal
                isOpen={isCameraModalOpen}
                onClose={() => setIsCameraModalOpen(false)}
                exercises={exercises}
                onMachineIdentified={(machineName) => {
                    setUserAddedEquipment(prev => [...new Set([...prev, machineName])]);
                }}
                onMachineNotFound={sendNewMachineEmail}
            />
            <AIChatModal 
                isOpen={isAIChatOpen}
                onClose={() => setIsAIChatOpen(false)}
                gymEquipmentConstraints={gymEquipmentConstraints}
                setGymEquipmentConstraints={setGymEquipmentConstraints}
                exercises={exercises}
                dislikedExercises={dislikedExercises}
                setDislikedExercises={setDislikedExercises}
                userProfile={userProfile}
                userAddedEquipment={userAddedEquipment}
            />
             <AvailableExercisesModal
                isOpen={isExercisesModalOpen}
                onClose={() => setIsExercisesModalOpen(false)}
                allExercises={exercises}
            />
            {!isAIChatOpen && !isCameraModalOpen && (
                <>
                    <FloatingAIChatBubble 
                        onChatClick={() => setIsAIChatOpen(true)}
                        onCameraClick={() => setIsCameraModalOpen(true)}
                    />
                    <BottomNav 
                        items={navItems} 
                        activeTab={activeTab} 
                        setActiveTab={setActiveTab} 
                    />
                </>
            )}
        </div>
    );
};

export default App;