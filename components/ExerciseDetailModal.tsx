import React from 'react';
import { X, Dumbbell, Target, Users } from 'lucide-react';
import type { PlannedExercise } from '../types';

interface ExerciseDetailModalProps {
    exercise: PlannedExercise | null;
    isOpen: boolean;
    onClose: () => void;
}

const getYouTubeEmbedUrl = (url: string) => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
        }
        const videoId = urlObj.searchParams.get('v');
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
    } catch (e) {
        console.error("Invalid YouTube URL:", url);
    }
    return null;
};

const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ exercise, isOpen, onClose }) => {
    if (!isOpen || !exercise) return null;

    const embedUrl = getYouTubeEmbedUrl(exercise.videoUrl);

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
                    <h2 className="text-xl font-bold text-brand-primary">{exercise.name}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"><X/></button>
                </header>

                <main className="overflow-y-auto p-4">
                    {embedUrl && (
                        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4 border border-gray-200 dark:border-white/10">
                            <iframe
                                width="100%"
                                height="100%"
                                src={embedUrl}
                                title={`YouTube video player for ${exercise.name}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    )}
                    
                    <p className="text-slate-500 dark:text-dark-text-secondary mb-4">{exercise.description}</p>
                    
                    <div className="space-y-3 bg-gray-50 dark:bg-dark-card p-4 rounded-lg border border-gray-200 dark:border-white/10">
                        <div className="flex items-start gap-3">
                            <div className="text-brand-primary mt-1"><Target size={20} /></div>
                            <div>
                                <h4 className="font-semibold text-slate-900 dark:text-dark-text-primary">Primary Muscle</h4>
                                <p className="text-slate-500 dark:text-dark-text-secondary">{exercise.primaryMuscle}</p>
                            </div>
                        </div>
                        {exercise.secondaryMuscles.length > 0 && (
                             <div className="flex items-start gap-3">
                                <div className="text-brand-secondary mt-1"><Users size={20} /></div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 dark:text-dark-text-primary">Secondary Muscles</h4>
                                    <p className="text-slate-500 dark:text-dark-text-secondary">{exercise.secondaryMuscles.join(', ')}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-start gap-3">
                            <div className="text-green-400 mt-1"><Dumbbell size={20} /></div>
                             <div>
                                <h4 className="font-semibold text-slate-900 dark:text-dark-text-primary">Equipment</h4>
                                <p className="text-slate-500 dark:text-dark-text-secondary">{exercise.equipment}</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ExerciseDetailModal;