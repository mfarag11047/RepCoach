import React, { useRef } from 'react';
import { Upload, X, Sun, Moon, List, CheckCircle } from 'lucide-react';
import type { UserProfile } from '../types';

interface PreferencesScreenProps {
    userProfile: UserProfile;
    setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    workoutReportImages: string[];
    setWorkoutReportImages: (images: string[]) => void;
    workoutKnowledge: string | null;
    knowledgeFilePreview: string | null;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    isKnowledgeApplied: boolean;
    onKnowledgeUpload: (file: File) => void;
    onClearKnowledge: () => void;
    onViewExercises: () => void;
}

const SelectInput: React.FC<{
    label: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    children: React.ReactNode;
}> = ({ label, value, onChange, children }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-slate-500 dark:text-dark-text-secondary mb-1">{label}</label>
        <select
            value={value}
            onChange={onChange}
            className="w-full bg-slate-100 dark:bg-dark-surface p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary border border-gray-200 dark:border-white/10 appearance-none"
        >
            {children}
        </select>
    </div>
);

const NumberInput: React.FC<{
    label: string;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    unit?: string;
}> = ({ label, value, onChange, unit }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-slate-500 dark:text-dark-text-secondary mb-1">{label}</label>
        <div className="relative">
             <input
                type="number"
                value={value}
                onChange={onChange}
                className="w-full bg-slate-100 dark:bg-dark-surface p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary border border-gray-200 dark:border-white/10 pr-12"
            />
            {unit && <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 dark:text-dark-text-secondary">{unit}</span>}
        </div>
    </div>
);


const PreferencesScreen: React.FC<PreferencesScreenProps> = (props) => {
    const { 
        userProfile, setUserProfile, workoutReportImages, setWorkoutReportImages,
        workoutKnowledge, knowledgeFilePreview, theme, setTheme,
        isKnowledgeApplied, onKnowledgeUpload, onClearKnowledge, onViewExercises
    } = props;

    const imageFileInputRef = useRef<HTMLInputElement>(null);
    const knowledgeFileInputRef = useRef<HTMLInputElement>(null);

    const handleProfileChange = (field: keyof UserProfile, value: string | number | null) => {
        setUserProfile(prevProfile => ({
            ...prevProfile,
            [field]: value,
        }));
    };

    const feet = Math.floor(userProfile.height / 12);
    const inches = userProfile.height % 12;

    const handleHeightChange = (part: 'feet' | 'inches', value: number) => {
        const currentFeet = Math.floor(userProfile.height / 12);
        const currentInches = userProfile.height % 12;

        let newTotalInches;
        if (part === 'feet') {
            newTotalInches = (value * 12) + currentInches;
        } else { // inches
            newTotalInches = (currentFeet * 12) + value;
        }
        handleProfileChange('height', newTotalInches);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        // Fix: Explicitly type `file` as `File` to prevent type inference issues where it could be treated as `unknown`.
        const imagePromises = Array.from(files).map((file: File) => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = (e) => reject(e);
                reader.readAsDataURL(file);
            });
        });

        try {
            const base64Images = await Promise.all(imagePromises);
            setWorkoutReportImages([...workoutReportImages, ...base64Images]);
        } catch (error) {
            console.error("Error reading image files:", error);
        }
    };
    
    const handleKnowledgeFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onKnowledgeUpload(file);
        }
    };

    const handleClearKnowledgeClick = () => {
        onClearKnowledge();
        if (knowledgeFileInputRef.current) {
            knowledgeFileInputRef.current.value = '';
        }
    };
    
    const handleThemeToggle = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <div className="p-4">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight">Preferences</h1>
                <p className="text-slate-500 dark:text-dark-text-secondary">Tailor your AI workout generation.</p>
            </header>

            <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg">
                <h2 className="text-xl font-bold text-brand-primary mb-3">Appearance</h2>
                <div className="flex items-center justify-between bg-slate-100 dark:bg-dark-surface p-3 rounded-lg">
                    <span className="font-medium text-slate-700 dark:text-dark-text-secondary">Theme</span>
                    <div className="flex items-center gap-3">
                        <Sun className="text-slate-500" />
                        <button 
                            onClick={handleThemeToggle}
                            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-300 dark:bg-gray-600 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                        >
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}></span>
                        </button>
                        <Moon className="text-slate-500" />
                    </div>
                </div>

                <div className="border-t border-gray-200 dark:border-white/10 my-6"></div>

                <h2 className="text-xl font-bold text-brand-primary mb-3">Personal Info</h2>
                
                <SelectInput
                    label="Gender"
                    value={userProfile.gender}
                    onChange={(e) => handleProfileChange('gender', e.target.value)}
                >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </SelectInput>
                
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-500 dark:text-dark-text-secondary mb-1">Height</label>
                    <div className="grid grid-cols-2 gap-x-4">
                        <div>
                            <select
                                value={feet}
                                onChange={(e) => handleHeightChange('feet', parseInt(e.target.value, 10))}
                                className="w-full bg-slate-100 dark:bg-dark-surface p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary border border-gray-200 dark:border-white/10 appearance-none"
                                aria-label="Height in feet"
                            >
                                {[4, 5, 6, 7].map(f => <option key={f} value={f}>{f} ft</option>)}
                            </select>
                        </div>
                        <div>
                             <select
                                value={inches}
                                onChange={(e) => handleHeightChange('inches', parseInt(e.target.value, 10))}
                                className="w-full bg-slate-100 dark:bg-dark-surface p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary border border-gray-200 dark:border-white/10 appearance-none"
                                aria-label="Height in inches"
                            >
                                {Array.from({ length: 12 }, (_, i) => i).map(i => <option key={i} value={i}>{i} in</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <NumberInput
                    label="Weight"
                    value={userProfile.weight}
                    onChange={(e) => handleProfileChange('weight', parseInt(e.target.value, 10) || 0)}
                    unit="lbs"
                />
                
                <div className="border-t border-gray-200 dark:border-white/10 my-4"></div>

                <h2 className="text-xl font-bold text-brand-primary mb-3">Workout Preferences</h2>

                <SelectInput
                    label="Gym"
                    value={userProfile.gym || ''}
                    onChange={(e) => handleProfileChange('gym', e.target.value)}
                >
                    <option value="" disabled>Select your gym...</option>
                    <option value="Planet Fitness">Planet Fitness</option>
                    <option value="LA Fitness">LA Fitness</option>
                    <option value="Anytime Fitness">Anytime Fitness</option>
                    <option value="24 Hour Fitness">24 Hour Fitness</option>
                    <option value="Gold's Gym">Gold's Gym</option>
                    <option value="Other">Other/Home Gym</option>
                </SelectInput>

                <SelectInput
                    label="Primary Goal"
                    value={userProfile.goal}
                    onChange={(e) => handleProfileChange('goal', e.target.value)}
                >
                    <option value="Build Muscle">Build Muscle</option>
                    <option value="Lose Weight">Lose Weight</option>
                    <option value="Gain Strength">Gain Strength</option>
                </SelectInput>
                
                <SelectInput
                    label="Target Workout Duration"
                    value={userProfile.workoutDuration || ''}
                    onChange={(e) => handleProfileChange('workoutDuration', e.target.value ? parseInt(e.target.value, 10) : null)}
                >
                    <option value="" disabled>Select a duration...</option>
                    <option value="30">Quick (~30 min)</option>
                    <option value="45">Standard (~45 min)</option>
                    <option value="60">Long (~60 min)</option>
                    <option value="90">Extended (~90 min)</option>
                </SelectInput>

                <SelectInput
                    label="Workout Split"
                    value={userProfile.workoutSplit}
                    onChange={(e) => handleProfileChange('workoutSplit', e.target.value)}
                >
                    <option value="Push/Pull/Legs">Push/Pull/Legs</option>
                    <option value="Full Body">Full Body</option>
                    <option value="Upper/Lower">Upper/Lower</option>
                    <option value="Body Part Split">Body Part Split (Bro Split)</option>
                </SelectInput>

                <SelectInput
                    label="Primary Training Style"
                    value={userProfile.trainingStyle}
                    onChange={(e) => handleProfileChange('trainingStyle', e.target.value)}
                >
                    <option value="Strength Training">Strength Training</option>
                    <option value="Hypertrophy">Hypertrophy</option>
                    <option value="Circuit Training">Circuit Training</option>
                    <option value="General Fitness">General Fitness</option>
                    <option value="Powerlifting">Powerlifting</option>
                    <option value="Olympic Weightlifting">Olympic Weightlifting</option>
                </SelectInput>

                <SelectInput
                    label="Experience Level"
                    value={userProfile.experience}
                    onChange={(e) => handleProfileChange('experience', e.target.value)}
                >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </SelectInput>
                
                <SelectInput
                    label="Training Frequency (days/week)"
                    value={userProfile.frequency}
                    onChange={(e) => handleProfileChange('frequency', parseInt(e.target.value, 10))}
                >
                    {[1, 2, 3, 4, 5, 6, 7].map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </SelectInput>
                
                <div className="border-t border-gray-200 dark:border-white/10 my-6"></div>

                <h2 className="text-xl font-bold text-brand-primary mb-3">Automation</h2>
                <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-3">
                    Set a time for Spot to automatically prepare your workout each day. It will be ready and waiting for you on the Workout screen.
                </p>
                <div className="flex items-end gap-4">
                   <div className="flex-grow">
                       <label htmlFor="auto-generate-time" className="block text-sm font-medium text-slate-500 dark:text-dark-text-secondary mb-1">Daily Generation Time</label>
                       <input
                           type="time"
                           id="auto-generate-time"
                           value={userProfile.autoGenerateTime || ''}
                           onChange={(e) => handleProfileChange('autoGenerateTime', e.target.value || null)}
                           className="w-full bg-slate-100 dark:bg-dark-surface p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary border border-gray-200 dark:border-white/10"
                       />
                   </div>
                   <button
                       onClick={() => handleProfileChange('autoGenerateTime', null)}
                       className="bg-slate-100 dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-slate-500 dark:text-dark-text-secondary font-bold p-3 rounded-lg transition-colors"
                       aria-label="Clear auto-generation time"
                   >
                       <X size={20} />
                   </button>
                </div>


                <div className="border-t border-gray-200 dark:border-white/10 my-6"></div>

                 <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-bold text-brand-primary">AI Knowledge Base</h2>
                    {isKnowledgeApplied && (
                        <div className="flex items-center gap-1.5 bg-recovery-fresh/20 text-recovery-fresh text-xs font-semibold px-2 py-1 rounded-full">
                            <CheckCircle size={14} />
                            <span>Custom Library Active</span>
                        </div>
                    )}
                 </div>
                <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-3">
                    Upload a `.json` file with an exercise list to override the app's default library. Alternatively, upload a `.txt` or `.md` file with your workout philosophy for the AI to follow.
                </p>
                <input
                    type="file"
                    ref={knowledgeFileInputRef}
                    onChange={handleKnowledgeFileSelect}
                    className="hidden"
                    accept=".txt,.md,.json"
                />
                 <button
                    onClick={() => knowledgeFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-slate-800 dark:text-dark-text-primary font-bold py-3 px-4 rounded-lg transition-colors mb-3"
                >
                    <Upload size={20} />
                    {workoutKnowledge ? 'Replace Knowledge File' : 'Upload Knowledge File'}
                </button>
                {workoutKnowledge && knowledgeFilePreview && (
                    <div className="mt-2">
                        <div className="p-3 bg-slate-100 dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-white/10">
                            <p className="text-xs font-semibold text-slate-500 dark:text-dark-text-secondary mb-1">File Content Preview:</p>
                            <pre className="text-xs text-slate-700 dark:text-dark-text-primary whitespace-pre-wrap break-words max-h-40 overflow-auto font-mono">
                                <code>{knowledgeFilePreview}</code>
                            </pre>
                        </div>
                        <button
                            onClick={handleClearKnowledgeClick}
                            className="w-full flex items-center justify-center gap-2 bg-recovery-fatigued/20 hover:bg-recovery-fatigued/40 text-recovery-fatigued font-bold py-2 px-4 rounded-lg transition-colors mt-3 text-sm"
                        >
                            <X size={16} />
                            Clear Knowledge File
                        </button>
                    </div>
                )}


                <div className="border-t border-gray-200 dark:border-white/10 my-6"></div>

                <div>
                    <h2 className="text-xl font-bold text-brand-primary mb-3">AI Equipment Knowledge</h2>
                    <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-3">
                        View the complete library of exercises Spot knows about. This list will update if you upload a custom exercise file.
                    </p>
                     <button onClick={onViewExercises} className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-slate-800 dark:text-dark-text-primary font-bold py-3 px-4 rounded-lg transition-colors">
                        <List size={20}/>
                        View Active Exercise Library
                    </button>
                </div>

                <div className="border-t border-gray-200 dark:border-white/10 my-6"></div>

                <h2 className="text-xl font-bold text-brand-primary mb-3">Workout History Integration</h2>
                <p className="text-sm text-slate-500 dark:text-dark-text-secondary mb-3">
                    Coming from another app? Upload screenshots of your workout reports. Spot will analyze them to understand your current strength and progression.
                </p>
                <input
                    type="file"
                    ref={imageFileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg"
                    multiple
                />
                <button
                    onClick={() => imageFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 dark:bg-dark-surface hover:bg-slate-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-slate-800 dark:text-dark-text-primary font-bold py-3 px-4 rounded-lg transition-colors"
                >
                    <Upload size={20} />
                    Upload Report Images
                </button>
                
                {workoutReportImages.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-medium text-slate-500 dark:text-dark-text-secondary mb-2">Uploaded Reports:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {workoutReportImages.map((imgSrc, index) => (
                                <div key={index} className="relative">
                                    <img src={imgSrc} alt={`Workout report ${index + 1}`} className="rounded-lg object-cover aspect-square" />
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setWorkoutReportImages([])}
                            className="w-full flex items-center justify-center gap-2 bg-recovery-fatigued/20 hover:bg-recovery-fatigued/40 text-recovery-fatigued font-bold py-2 px-4 rounded-lg transition-colors mt-3 text-sm"
                        >
                            <X size={16} />
                            Clear Images
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PreferencesScreen;