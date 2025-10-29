import { GoogleGenAI, Type } from "@google/genai";
import type { UserProfile, Exercise, WorkoutHistory, GroupedRecoveryStatus, GymBrand } from '../types';

// The API key must be obtained exclusively from the environment variable `process.env.API_KEY`.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
const proModel = 'gemini-2.5-pro';
const flashModel = 'gemini-2.5-flash';

/**
 * Simulates sending an email notification to the developers about a new machine.
 * In a real-world application, this would make an API call to a backend service.
 * @param machineName The name of the machine identified by the AI.
 * @param imageBase64 The base64 encoded image of the machine.
 */
export const sendNewMachineEmail = (machineName: string, imageBase64: string): void => {
    const emailDetails = {
        to: 'dev-team@repcoach.app',
        from: 'repcoach-noreply@example.com',
        subject: 'New Machine Submission from RepCoach User',
        body: `A user submitted a new machine that was not found in the exercise database.\n\nAI Identified Name: ${machineName}\n\nPlease review the attached image and consider adding this machine and associated exercises to the app.`,
        attachment_image_base64_snippet: imageBase64.substring(0, 100) + '...'
    };

    console.log('--- SIMULATING EMAIL NOTIFICATION ---');
    console.log(emailDetails);
    console.log('-------------------------------------');
};

export const identifyMachineFromImage = async (imageBase64: string): Promise<string> => {
    const prompt = `Analyze this image of a piece of gym equipment. Identify the specific name of the machine (e.g., "Seated Leg Press Machine", "Pec Deck Fly Machine", "Lat Pulldown"). Return ONLY a JSON object with a single key "machineName". For example: {"machineName": "Lat Pulldown Machine"}.`;
    
    const match = imageBase64.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        throw new Error("Invalid image data URL format");
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const imagePart = { inlineData: { mimeType, data: base64Data } };
    const textPart = { text: prompt };

    try {
        const response = await ai.models.generateContent({
            model: flashModel, // 'gemini-2.5-flash' is sufficient and faster for this task
            contents: { parts: [textPart, imagePart] },
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        machineName: { type: Type.STRING }
                    }
                 }
            }
        });

        const responseText = response.text.trim();
        const result = JSON.parse(responseText);
        
        if (result && typeof result.machineName === 'string' && result.machineName.trim() !== '') {
            return result.machineName.trim();
        } else {
            throw new Error("AI could not identify the machine name from the image.");
        }

    } catch (e: any) {
        console.error("Error identifying machine:", e);
        throw new Error("Could not analyze the image. The AI model might be unavailable or returned an unexpected response.");
    }
}


const GYM_EQUIPMENT_KNOWLEDGE: Record<GymBrand, string> = {
    'Planet Fitness': `
        - Philosophy: Beginner-friendly, non-intimidating.
        - Key Omissions: No free-weight barbell squat racks, power cages, free-weight Olympic barbells, or deadlift platforms.
        - Selectorized Machines: Chest Press, Pectoral Fly, Bicep Curl, Shoulder Press, Lateral Raise, Row, Pulldown, Tricep Extension, Leg Press, Leg Extension, Leg Curl, Hip Adduction, Hip Abduction, Torso Rotation, Abdominal Crunch.
        - Plate-Loaded Machines: Limited Hammer Strength (Chest Press, Incline Press, Shoulder Press, Row, Leg Press, Pulldown).
        - Free Weights: Dumbbells (5-75 lbs), Fixed-Weight Barbells (max 60 lbs).
        - Racks & Benches: Smith Machines (primary for barbell movements), Flat Benches, Adjustable Benches.
        - Functional: TRX, light Kettlebells, Medicine balls, BOSU balls, Resistance bands.
    `,
    'LA Fitness': `
        - Philosophy: Full-service with comprehensive equipment.
        - Machines: Extensive Life Fitness and Hammer Strength lines, including Iso-Lateral machines. Specialty machines like Booty Builder.
        - Free Weights: Dumbbells (5-150 lbs), full complement of Olympic Barbells and plates.
        - Racks & Benches: Multiple Squat Racks, Power Cages, and Smith Machines. Full range of benches (flat, incline, decline).
        - Functional: Dedicated functional training zones with turf, Kettlebells, TRX.
    `,
    'Anytime Fitness': `
        - Philosophy: 24/7 convenience model. Equipment is functional but highly variable by location.
        - Machines: Technogym, Precor, Hammer Strength (e.g., T-Bar Row, Hack Squat).
        - Free Weights: Dumbbells (up to 100+ lbs), Olympic Barbells & Plates.
        - Racks & Benches: Power Racks, Squat Racks, Smith Machines are common.
        - Functional: Functional training areas with turf, Kettlebells, Battle ropes, TRX, Sandbags.
    `,
    '24 Hour Fitness': `
        - Philosophy: Performance-oriented, caters to serious lifters. Partnership with Eleiko.
        - Machines: Hoist, Life Fitness, Hammer Strength.
        - Free Weights: Dumbbells (up to 120+ lbs), Olympic Barbells, Bumper Plates.
        - Racks & Benches: Multiple Squat Racks, Power Racks, and dedicated Bench Press stations.
        - Specialty (Olympic Lifting): Eleiko bars, discs, and SVR platforms.
        - Functional: CrossFit-style rigs.
    `,
    'Gold\'s Gym': `
        - Philosophy: Bodybuilding-centric ("The Mecca"). Extensive and heavy-duty equipment.
        - Machines: Gym80, Hammer Strength, Life Fitness, Cybex. High density and variety.
        - Free Weights: Dumbbells (up to 100+ lbs, often higher), massive inventory of Olympic Barbells & Plates, Specialty Bars.
        - Racks & Benches: Multiple Squat Racks and Power Cages.
        - Functional & Specialty: Climbing ropes, battle ropes, punching bags, large functional training spaces.
    `,
    'Other': `
        - User has a home gym or a gym not on this list. Rely on the user's manual equipment constraints and the equipment specified for each exercise in the 'Available Exercises' list. Assume standard equipment like dumbbells and benches are available unless specified otherwise.
    `
};

export interface WorkoutPlanItem {
    exerciseId: string;
    sets: number;
    reps: string;
    recommendedWeight: string;
}

export const generateWorkoutFromKnowledge = async (
    userProfile: UserProfile,
    workoutKnowledge: string | null,
    exercises: Exercise[],
    workoutHistory: WorkoutHistory,
    recoveryStatus: GroupedRecoveryStatus,
    workoutReportImages: string[] | undefined,
    gymEquipmentConstraints: string,
    dislikedExercises: string[],
    userAddedEquipment: string[]
): Promise<WorkoutPlanItem[]> => {

    const availableExercises = exercises.filter(ex => !dislikedExercises.includes(ex.id));
    const dislikedExerciseNames = dislikedExercises
        .map(id => exercises.find(ex => ex.id === id)?.name)
        .filter(Boolean)
        .join(', ');
    
    // Get the last 3 workouts for context, sorted by most recent first
    const recentHistory = Object.entries(workoutHistory)
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .slice(0, 3)
        .map(([date, workout]) => ({
            date: new Date(date).toDateString(),
            exercises: workout.exercises.map(e => ({
                name: e.name,
                sets: e.sets.map(s => `${s.reps} reps at ${s.weight} lbs`).join(', ')
            }))
        }));
        
    const gymName = userProfile.gym || 'Not specified';
    
    let knowledgeType: 'json' | 'text' | 'none' = 'none';
    if (workoutKnowledge) {
        try {
            const parsed = JSON.parse(workoutKnowledge);
            if (Array.isArray(parsed) && parsed.length > 0 && 'id' in parsed[0] && 'name' in parsed[0]) {
                 knowledgeType = 'json';
            } else {
                 knowledgeType = 'text'; // It's valid JSON but not an exercise list, treat as rules.
            }
        } catch {
            knowledgeType = 'text'; // Not valid JSON, so it must be a text file.
        }
    }
    
    let textPrompt = `You are Spot, a world-class AI fitness coach acting as a master orchestrator. Your primary goal is to synthesize all provided data into a single, perfect workout plan. Your instructions must be followed with perfect precision. The user's custom knowledge base is your absolute source of truth and overrides everything else.`;

    if (knowledgeType === 'text') {
         textPrompt += `
        \n\n**CRITICAL: The User's Custom Knowledge Base (ABSOLUTE SOURCE OF TRUTH)**
        The user has provided a custom text file that dictates ALL rules for generating their workout. This is the single, highest-priority document.
        ---
        ${workoutKnowledge}
        ---
        **You MUST treat the contents of this file as the SOLE and ABSOLUTE source of instructions. It overrides ALL of your general knowledge. If this file specifies equipment, rules, or exercises, you MUST adhere to them strictly. Do not use any other source of information for workout philosophy or equipment constraints.**
        `;
    } else { // 'json' or 'none'
        const knowledgeIntro = knowledgeType === 'json'
            ? "The user has provided a custom JSON file. Interpret this data as a strict set of rules."
            : "The user has not provided a custom text-based knowledge file. Use general best practices.";

        textPrompt += `
        \n\n**User's Custom Knowledge Base (HIGHEST PRIORITY)**
        ${knowledgeIntro}
        ${knowledgeType === 'json' ? `---${workoutKnowledge}---` : ''}
        **If a knowledge base is provided above, you MUST treat its contents as the most important source of instructions. If any instruction in the file conflicts with your general knowledge or other parts of this prompt, you MUST follow the instructions from the user's knowledge base.**
        `;
    }
    
    textPrompt += `
        \n\nNow, using the information provided (especially the user's knowledge base, if present), synthesize the following data to create the workout plan.

        **User Profile:**
        - Gender: ${userProfile.gender}
        - Height: ${userProfile.height} inches
        - Weight: ${userProfile.weight} lbs
        - Primary Goal: ${userProfile.goal}
        - Experience Level: ${userProfile.experience}
        - Training Frequency: ${userProfile.frequency} workouts per week
        - Target Workout Duration: ${userProfile.workoutDuration ? `${userProfile.workoutDuration} minutes` : 'Not specified'}
        - Desired Workout Split: ${userProfile.workoutSplit}
        - Primary Training Style: ${userProfile.trainingStyle}
        - Gym: ${gymName}
    `;
    
    // Only add the generic equipment guide if the user hasn't provided their own text-based rules.
    if (knowledgeType !== 'text') {
        const equipmentKnowledge = GYM_EQUIPMENT_KNOWLEDGE[userProfile.gym || 'Other'];
        textPrompt += `
        \n\n**Available Equipment at ${gymName} (General Guide):**
        This is a general guide. It can be overridden by user-provided constraints.
        ---
        ${equipmentKnowledge}
        ---
        `;
    }
    
    if (userAddedEquipment.length > 0) {
        textPrompt += `
        \n\n**User-Confirmed Available Equipment (via Photo Scan - HIGH PRIORITY):**
        The user has personally scanned and confirmed the availability of the following machines. Prioritize using these if they fit the workout plan.
        - ${userAddedEquipment.join('\n- ')}
        `;
    }
    
    textPrompt += `
        \n\n**User's Muscle Recovery Status (100% is fully recovered):**
        ---
        ${JSON.stringify(recoveryStatus, null, 2)}
        ---

        **User's Recent Workout History (for progression reference):**
        ---
        ${JSON.stringify(recentHistory, null, 2)}
        ---

        **User's Specific Gym Equipment Constraints (CRITICAL - Adhere to these user-provided limits. This overrides all other equipment knowledge):**
        This includes things like a machine being broken or having a maximum weight.
        ---
        ${gymEquipmentConstraints || 'None specified.'}
        ---

        **Disliked Exercises (CRITICAL - DO NOT recommend any of these):**
        ---
        ${dislikedExerciseNames || 'None specified.'}
        ---
    `;

    if (workoutReportImages && workoutReportImages.length > 0) {
        textPrompt += `
        \n\n**Workout Report Images Analysis:**
        The user has uploaded screenshots from their previous workout app. Analyze these images to understand their current strength levels and recent progress.
        `;
    }

    textPrompt += `
        \n\n**Generation Instructions:**
        1.  **Prioritize User Knowledge:** Your entire plan MUST be shaped by the user's custom knowledge base, if one was provided. This is the most important rule.
        2.  **Determine Today's Workout:** Based on the user's profile and knowledge base, decide which muscles to train.
        3.  **Select Exercises:** Choose exercises ONLY from the 'Available Exercises' list below. The number of exercises should align with the 'Target Workout Duration'.
        4.  **Respect ALL Constraints:** Adhere strictly to equipment availability (user-scanned > user-constraints > user knowledge file > general guide), and disliked exercises.
        5.  **Recommend Sets & Reps:** Provide a number of sets and a rep range (e.g., "8-12 reps").
        6.  **Recommend Weight:** Calculate a specific starting weight. Base this on 'Recent Workout History' and 'Workout Report Images' to apply progressive overload. Adjust based on 'Muscle Recovery Status'. The recommended weight should be a string, like "135 lbs" or "Bodyweight".
        7.  **Final Output:** Your response must be ONLY a JSON object with a single key "workoutPlan", which is an array of objects. Each object must contain "exerciseId", "sets", "reps", and "recommendedWeight".

        **Available Exercises (return a list of IDs from this list ONLY):**
        ---
        ${JSON.stringify(availableExercises.map(e => ({id: e.id, name: e.name, primaryMuscle: e.primaryMuscle, type: e.type, equipment: e.equipment})), null, 2)}
        ---
    `;
    
    let requestContents;

    if (workoutReportImages && workoutReportImages.length > 0) {
        const textPart = { text: textPrompt };
        const imageParts = workoutReportImages.map(imgDataUrl => {
            const match = imgDataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
            if (!match) {
                console.error("Invalid image data URL format");
                return null;
            }
            const mimeType = match[1];
            const base64Data = match[2];
            return { inlineData: { mimeType, data: base64Data } };
        }).filter((p): p is { inlineData: { mimeType: string; data: string; } } => p !== null);

        requestContents = { parts: [textPart, ...imageParts] };
    } else {
        requestContents = textPrompt;
    }

    try {
        const response = await ai.models.generateContent({
            model: proModel,
            contents: requestContents,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        workoutPlan: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    exerciseId: { type: Type.STRING },
                                    sets: { type: Type.INTEGER },
                                    reps: { type: Type.STRING },
                                    recommendedWeight: { type: Type.STRING },
                                }
                            }
                        }
                    }
                }
            }
        });

        const responseText = response.text.trim();
        const result = JSON.parse(responseText);
        if (result && Array.isArray(result.workoutPlan)) {
            const validIds = new Set(availableExercises.map(e => e.id));
            const filteredPlan = result.workoutPlan.filter((item: any) => 
                validIds.has(item.exerciseId) &&
                typeof item.sets === 'number' &&
                typeof item.reps === 'string' &&
                typeof item.recommendedWeight === 'string'
            );
            if (filteredPlan.length === 0) {
                 throw new Error("The AI returned a plan, but none of the exercises match your library.");
            }
            return filteredPlan as WorkoutPlanItem[];
        } else {
            throw new Error("AI returned an invalid data format.");
        }
    } catch (e: any) {
        console.error("Error generating workout:", e);
        throw new Error("Could not generate workout. The AI model might be unavailable or returned an unexpected response.");
    }
};