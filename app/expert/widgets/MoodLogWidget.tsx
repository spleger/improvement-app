'use client';
import { useState } from 'react';

interface Props {
    onLog?: () => void;
}

function getColor(value: number): string {
    if (value <= 3) return '#ef4444';
    if (value <= 6) return '#eab308';
    return '#22c55e';
}

export default function MoodLogWidget({ onLog }: Props) {
    const [mood, setMood] = useState(5);
    const [energy, setEnergy] = useState(5);
    const [motivation, setMotivation] = useState(5);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/surveys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    overallMood: mood,
                    energyLevel: energy,
                    motivationLevel: motivation,
                    notes: 'Logged via Expert Chat'
                })
            });
            const data = await res.json();
            if (data.success) {
                setSubmitted(true);
                if (onLog) onLog();
            } else {
                setError(data.error || 'Failed to save check-in');
            }
        } catch (e) {
            console.error(e);
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg animate-fade-in">
                <div className="text-green-400 font-bold text-center mb-3">Check-in logged!</div>
                <div className="flex justify-around text-center">
                    <div>
                        <div className="text-lg font-bold" style={{ color: getColor(mood) }}>{mood}</div>
                        <div className="text-xs text-muted">Mood</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold" style={{ color: getColor(energy) }}>{energy}</div>
                        <div className="text-xs text-muted">Energy</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold" style={{ color: getColor(motivation) }}>{motivation}</div>
                        <div className="text-xs text-muted">Motivation</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card p-4 my-2">
            <h4 className="text-sm font-medium text-center mb-4">Quick Check-in</h4>

            <div className="flex flex-col gap-4">
                <SliderRow label="Mood" value={mood} onChange={setMood} low="Low" high="Great" />
                <SliderRow label="Energy" value={energy} onChange={setEnergy} low="Tired" high="Energized" />
                <SliderRow label="Motivation" value={motivation} onChange={setMotivation} low="Low" high="Fired up" />
            </div>

            {error && <div className="text-sm text-red-400 mt-2 text-center">{error}</div>}

            <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn btn-primary w-full justify-center mt-4"
            >
                {loading ? 'Saving...' : 'Submit Check-in'}
            </button>
        </div>
    );
}

function SliderRow({ label, value, onChange, low, high }: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    low: string;
    high: string;
}) {
    const color = getColor(value);
    const pct = ((value - 1) / 9) * 100;

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-muted uppercase tracking-wider">{label}</span>
                <span className="text-sm font-bold" style={{ color }}>{value}/10</span>
            </div>
            <input
                type="range"
                min={1}
                max={10}
                value={value}
                onChange={e => onChange(parseInt(e.target.value))}
                className="slider w-full"
                style={{
                    '--slider-fill': `${pct}%`,
                    '--slider-color': color,
                } as React.CSSProperties}
            />
            <div className="flex justify-between text-tiny text-muted mt-0.5">
                <span>{low}</span>
                <span>{high}</span>
            </div>
        </div>
    );
}
