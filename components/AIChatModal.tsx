
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ChatMessage, Exercise, UserProfile } from '../types';
import { GoogleGenAI, Chat, FunctionDeclaration, Type } from '@google/genai';

interface AIChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    gymEquipmentConstraints: string;
    setGymEquipmentConstraints: (updater: (prev: string) => string) => void;
    exercises: Exercise[];
    dislikedExercises: string[];
    setDislikedExercises: (updater: (prev: string[]) => string[]) => void;
    userProfile: UserProfile;
    userAddedEquipment: string[];
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const updateGymEquipmentConstraint: FunctionDeclaration = {
    name: 'updateGymEquipmentConstraint',
    description: "Updates the user's gym equipment constraints. Use this when the user specifies a limitation for a piece of equipment, such as a maximum weight limit, if it's broken, or other operational issues. This information will be used to adjust future workout plans.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            equipmentName: {
                type: Type.STRING,
                description: 'The name of the gym equipment (e.g., "Leg Press Machine", "Cable Crossover").'
            },
            constraint: {
                type: Type.STRING,
                description: 'The specific constraint reported by the user (e.g., "max weight is 400 lbs", "is broken", "only goes up in 20 lb increments").'
            }
        },
        required: ['equipmentName', 'constraint']
    }
};

const addDislikedExercise: FunctionDeclaration = {
    name: 'addDislikedExercise',
    description: "Adds an exercise to the user's disliked list. Use this when the user explicitly states they don't like, want to avoid, or can't do a specific exercise.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            exerciseName: {
                type: Type.STRING,
                description: 'The name of the exercise the user dislikes (e.g., "Squat", "Deadlift"). Match it as closely as possible to the known exercises.'
            }
        },
        required: ['exerciseName']
    }
};

const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, gymEquipmentConstraints, setGymEquipmentConstraints, exercises, dislikedExercises, setDislikedExercises, userProfile, userAddedEquipment }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: 'initial', sender: 'ai', text: "Hello! I'm Spot, your AI fitness coach. How can I help? Feel free to tell me about your gym's equipment limitations or exercises you dislike." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const dislikedExerciseNames = dislikedExercises
            .map(id => exercises.find(ex => ex.id === id)?.name)
            .filter(Boolean)
            .join(', ');

        const gymName = userProfile.gym || 'an unspecified gym';

        const systemInstruction = `You are Spot, a friendly and knowledgeable AI fitness coach. You provide advice on workouts, nutrition, recovery, and motivation. You can also remember user-specific information. You MUST use the provided tools to remember information.

CONTEXT:
The user works out at ${gymName}. Be mindful of typical equipment limitations if they ask for exercise suggestions (e.g., Planet Fitness has no free barbells).

USER-CONFIRMED EQUIPMENT (via Photo Scan - This is absolute truth):
${userAddedEquipment.length > 0 ? userAddedEquipment.join(', ') : 'None'}

CURRENTLY KNOWN GYM CONSTRAINTS:
${gymEquipmentConstraints || 'None'}

DISLIKED EXERCISES (DO NOT RECOMMEND THESE):
${dislikedExerciseNames || 'None'}

Keep your answers concise, encouraging, and easy to understand. Use markdown for formatting.`;
        
        const newChat = ai.chats.create({
            model: 'gemini-2.5-pro',
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: [updateGymEquipmentConstraint, addDislikedExercise] }]
            }
        });
        setChat(newChat);
    }, [gymEquipmentConstraints, dislikedExercises, exercises, userProfile.gym, userAddedEquipment]);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);
    
    const handleSendMessage = async () => {
        if (!input.trim() || !chat || isLoading) return;

        const userMessage: ChatMessage = { id: `user-${Date.now()}`, sender: 'user', text: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            let response = await chat.sendMessage({ message: currentInput });

            if (response.functionCalls && response.functionCalls.length > 0) {
                const toolResponses = [];
                for (const fc of response.functionCalls) {
                    if (fc.name === 'updateGymEquipmentConstraint' && fc.args) {
                        const { equipmentName, constraint } = fc.args;
                        const newConstraintText = `- ${equipmentName}: ${constraint}`;
                        setGymEquipmentConstraints(prev => (prev ? `${prev}\n${newConstraintText}` : newConstraintText));
                        toolResponses.push({
                            id: fc.id,
                            name: fc.name,
                            response: { result: `Successfully noted constraint for ${equipmentName}.` }
                        });
                    } else if (fc.name === 'addDislikedExercise' && fc.args) {
                        const { exerciseName } = fc.args;
                        const exercise = exercises.find(ex => ex.name.toLowerCase() === (exerciseName as string).toLowerCase());
                        if (exercise) {
                            setDislikedExercises(prev => [...new Set([...prev, exercise.id])]);
                            toolResponses.push({
                                id: fc.id,
                                name: fc.name,
                                response: { result: `Successfully noted that the user dislikes ${exercise.name}. I will not recommend it anymore.` }
                            });
                        } else {
                             toolResponses.push({
                                id: fc.id,
                                name: fc.name,
                                response: { result: `Could not find an exercise named '${exerciseName}'.` }
                            });
                        }
                    }
                }
                
                if (toolResponses.length > 0) {
                    const toolResponse = await chat.sendMessage({ toolResponse: { functionResponses: toolResponses } });
                    const finalAiMessage: ChatMessage = { id: `ai-${Date.now()}`, sender: 'ai', text: toolResponse.text };
                    setMessages(prev => [...prev, finalAiMessage]);
                }

            } else {
                const aiMessage: ChatMessage = { id: `ai-${Date.now()}`, sender: 'ai', text: response.text };
                setMessages(prev => [...prev, aiMessage]);
            }
        } catch (error: any) {
            const errorMessage: ChatMessage = { id: `err-${Date.now()}`, sender: 'ai', text: `Sorry, I ran into an error: ${error.message}` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex flex-col animate-fade-in" aria-modal="true" role="dialog">
            <div className="flex-1 flex flex-col h-full m-4 bg-white/90 dark:bg-dark-surface/80 backdrop-blur-lg border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl">
                <header className="flex-shrink-0 flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/10">
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Bot size={24} className="text-brand-primary" /> Spot</h1>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"><X size={24} /></button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''} animate-fade-in`}>
                            {msg.sender === 'ai' && <div className="bg-brand-primary p-2 rounded-full shadow-lg"><Bot size={20} className="text-white" /></div>}
                            <div className={`max-w-xs md:max-w-md p-3 rounded-xl shadow-md ${msg.sender === 'user' ? 'bg-brand-primary text-white' : 'bg-gray-100 dark:bg-dark-card'}`}>
                               <ReactMarkdown className="prose prose-sm prose-slate dark:prose-invert">{msg.text || ''}</ReactMarkdown>
                            </div>
                             {msg.sender === 'user' && <div className="bg-gray-100 dark:bg-dark-surface p-2 rounded-full shadow-lg"><User size={20} /></div>}
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex items-start gap-3 animate-fade-in">
                            <div className="bg-brand-primary p-2 rounded-full shadow-lg"><Bot size={20} className="text-white" /></div>
                            <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-gray-100 dark:bg-dark-card flex items-center shadow-md">
                                <Loader2 size={20} className="animate-spin text-slate-500 dark:text-dark-text-secondary"/>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                
                <div className="flex-shrink-0 flex items-center gap-4 border-t border-gray-200 dark:border-white/10 p-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ask Spot..."
                        className="flex-1 bg-gray-100 dark:bg-dark-surface p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary border border-gray-200 dark:border-white/10"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !input.trim()}
                        className="p-3 bg-brand-primary rounded-lg text-white disabled:bg-gray-600 disabled:cursor-not-allowed transition-all transform hover:scale-110"
                        aria-label="Send message"
                    >
                        {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChatModal;