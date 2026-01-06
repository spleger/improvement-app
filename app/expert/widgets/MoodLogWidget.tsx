'use client';
import { useState } from 'react';

export default function MoodLogWidget({ onLog }: { onLog?: (mood: number) => void }) {
    const [selectedMood, setSelectedMood] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (mood: number) => {
        setSelectedMood(mood);
        try {
            await fetch('/api/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    overallMood: mood,
                    energyLevel: 5, // Default average
                    motivationLevel: 5,
                    notes: 'Logged via Expert Chat'
                })
            });
            setSubmitted(true);
            if (onLog) onLog(mood);
        } catch (e) {
            console.error(e);
        }
    };

    if (submitted) {
        return (
            <div className="p-3 bg-surface border border-border rounded-lg text-center text-sm text-muted animate-fade-in">
                Mood logged as {selectedMood}/10. Thanks for checking in!
            </div>
        );
    }

    return (
        <div className="card p-4 my-2">
            <h4 className="text-sm font-medium text-center mb-3">How are you feeling right now?</h4>
            <div className="flex justify-between gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <button
                        key={num}
                        onClick={() => handleSubmit(num)}
                        className={`
                            w-8 h-10 rounded text-sm font-bold transition-all
                            ${num <= 3 ? 'hover:bg-red-500/20 hover:text-red-400' :
                                num <= 7 ? 'hover:bg-yellow-500/20 hover:text-yellow-400' :
                                    'hover:bg-green-500/20 hover:text-green-400'}
                            bg-surface border border-border
                        `}
                    >
                        {num}
                    </button>
                ))}
            </div>
            <div className="flex justify-between text-tiny text-muted mt-2 px-1">
                <span>Low</span>
                <span>High</span>
            </div>
        </div>
    );
}
