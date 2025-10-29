import React, { useState } from 'react';
import { Bot, Camera, X } from 'lucide-react';

interface FloatingAIChatBubbleProps {
    onChatClick: () => void;
    onCameraClick: () => void;
}

const FloatingAIChatBubble: React.FC<FloatingAIChatBubbleProps> = ({ onChatClick, onCameraClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handlePrimaryClick = () => {
        setIsExpanded(!isExpanded);
    };
    
    const handleChatClick = () => {
        onChatClick();
        setIsExpanded(false);
    };
    
    const handleCameraClick = () => {
        onCameraClick();
        setIsExpanded(false);
    };

    return (
        <div className="fixed bottom-28 right-4 z-40 flex flex-col items-end gap-4">
             {isExpanded && (
                <div className="flex flex-col items-end gap-4 transition-all duration-300 animate-fade-in">
                    {/* Camera Button */}
                    <div className="flex items-center gap-3">
                        <span className="bg-white dark:bg-dark-card text-slate-800 dark:text-white text-sm px-3 py-1 rounded-full shadow-lg border border-gray-200 dark:border-white/10">Scan Machine</span>
                         <button
                            onClick={handleCameraClick}
                            className="bg-white dark:bg-dark-surface text-slate-800 dark:text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all duration-300"
                            aria-label="Scan gym machine"
                        >
                            <Camera size={28} />
                        </button>
                    </div>
                    {/* Chat Button */}
                    <div className="flex items-center gap-3">
                         <span className="bg-white dark:bg-dark-card text-slate-800 dark:text-white text-sm px-3 py-1 rounded-full shadow-lg border border-gray-200 dark:border-white/10">Ask Spot</span>
                        <button
                            onClick={handleChatClick}
                            className="bg-white dark:bg-dark-surface text-slate-800 dark:text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all duration-300"
                            aria-label="Open Spot AI Chat"
                        >
                            <Bot size={28} />
                        </button>
                    </div>
                </div>
            )}
            {/* Primary Button */}
            <button
                onClick={handlePrimaryClick}
                className="bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to text-white w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:shadow-glow-primary transition-all duration-300 transform hover:scale-110"
                aria-label={isExpanded ? "Close actions" : "Open Spot AI actions"}
                aria-expanded={isExpanded}
            >
                {isExpanded ? <X size={32} /> : <Bot size={32} />}
            </button>
        </div>
    );
};

export default FloatingAIChatBubble;