import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { WorkoutHistory, Workout } from '../types';

interface ProgressScreenProps {
    workoutHistory: WorkoutHistory;
}

type TimePeriod = '1M' | '3M' | '1Y' | 'All';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-lg border border-gray-200 dark:border-white/10 p-3 rounded-lg shadow-lg">
        <p className="label text-slate-500 dark:text-dark-text-secondary">{`${label}`}</p>
        <p className="intro text-brand-primary font-bold">{`Volume : ${payload[0].value.toLocaleString()} lbs`}</p>
      </div>
    );
  }

  return null;
};


const ProgressScreen: React.FC<ProgressScreenProps> = ({ workoutHistory }) => {
    const [timePeriod, setTimePeriod] = useState<TimePeriod>('3M');

    const chartData = useMemo(() => {
        const now = new Date();
        let startDate = new Date(0); // Default to epoch for 'All'

        // Create a mutable copy for date calculations
        const tempDate = new Date();
        switch (timePeriod) {
            case '1M':
                startDate = new Date(tempDate.setMonth(now.getMonth() - 1));
                break;
            case '3M':
                startDate = new Date(tempDate.setMonth(now.getMonth() - 3));
                break;
            case '1Y':
                startDate = new Date(tempDate.setFullYear(now.getFullYear() - 1));
                break;
        }

        const filteredHistory = (Object.entries(workoutHistory) as [string, Workout][])
            .filter(([dateStr]) => new Date(dateStr) >= startDate);
            
        filteredHistory.sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());

        return filteredHistory.map(([date, workout]) => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            volume: workout.totalVolume,
            calories: workout.calories,
        }));
    }, [workoutHistory, timePeriod]);

    const overallStrength = useMemo(() => {
        const allTimeWorkouts = Object.values(workoutHistory) as Workout[];
        if (allTimeWorkouts.length === 0) return 100;
        const totalVolume = allTimeWorkouts.reduce((acc, curr) => acc + curr.totalVolume, 0);
        return 100 + totalVolume / 1000;
    }, [workoutHistory]);
    
    const timePeriods: { label: string; value: TimePeriod }[] = [
        { label: '1M', value: '1M' },
        { label: '3M', value: '3M' },
        { label: '1Y', value: '1Y' },
        { label: 'All', value: 'All' },
    ];

    return (
        <div className="p-4">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight">Progress</h1>
                <p className="text-slate-500 dark:text-dark-text-secondary">Visualize your hard-earned gains.</p>
            </header>

            <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg mb-6 animate-fade-in">
                <h2 className="text-lg font-semibold mb-1 text-slate-900 dark:text-dark-text-primary">Overall Strength Score</h2>
                <p className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-brand-gradient-from to-brand-gradient-to">{overallStrength.toFixed(0)}</p>
                <p className="text-xs text-slate-500 dark:text-dark-text-secondary">A measure of your total lifting volume over time.</p>
            </div>

            <div className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-lg font-semibold">Total Volume (lbs)</h2>
                     <div className="flex justify-center gap-1 p-1 bg-gray-100 dark:bg-dark-surface rounded-full border border-gray-200 dark:border-white/10">
                        {timePeriods.map(({ label, value }) => (
                            <button
                                key={value}
                                onClick={() => setTimePeriod(value)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-300 ${
                                    timePeriod === value
                                        ? 'bg-brand-primary text-white'
                                        : 'text-slate-500 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-white/10'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
               
                {chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(161, 161, 170, 0.2)" />
                            <XAxis dataKey="date" stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#A1A1AA" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(161, 161, 170, 0.1)' }}/>
                            <defs>
                                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF453A" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#FF453A" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Line type="monotone" dataKey="volume" stroke="#FF453A" strokeWidth={3} dot={false} activeDot={{ r: 8, fill: '#FF453A', stroke: '#10111A', strokeWidth: 2 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-500 dark:text-dark-text-secondary text-center">
                        <p>Not enough data for this time period. <br/> Log more workouts to see your progress!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgressScreen;