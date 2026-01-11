'use client';

import { useState } from 'react';
import { X, Check, Command, Sparkles, Smile, Zap, Heart, Brain, Crown, Star } from 'lucide-react';

interface CreateCoachModalProps {
    onClose: () => void;
    onCreated: (coach: any) => void;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#ef4444', '#f59e0b', '#6366f1', '#14b8a6'];
const ICONS = ['🤖', '🧠', '💪', '🧘', '💜', '🗣️', '🛡️', '🎯', '🔄', '⭐', '🚀', '🔥', '💡', '🎓', '🦁'];

export default function CreateCoachModal({ onClose, onCreated }: CreateCoachModalProps) {
    const [name, setName] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !systemPrompt) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/coaches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    systemPrompt,
                    color: selectedColor,
                    icon: selectedIcon
                })
            });
            const data = await res.json();
            if (data.success) {
                onCreated(data.data.coach);
                onClose();
            }
        } catch (error) {
            console.error('Failed to create coach', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-surface-2">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="text-primary" size={20} />
                        Create AI Coach
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-surface-3 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Preview Card */}
                    <div className="flex justify-center mb-6">
                        <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-surface-2 border border-border w-40 transition-all duration-300"
                            style={{ borderColor: selectedColor, boxShadow: `0 8px 24px -6px ${selectedColor}40` }}>
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-colors duration-300"
                                style={{ background: selectedColor }}>
                                {selectedIcon}
                            </div>
                            <div className="text-center">
                                <span className="block font-bold text-sm truncate w-32">{name || 'Coach Name'}</span>
                                <span className="text-xs text-muted">Custom AI</span>
                            </div>
                        </div>
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5 ml-1">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Tough Love Coach"
                            className="w-full p-3 rounded-xl bg-surface-2 border-2 border-border focus:border-primary outline-none transition-colors"
                            maxLength={30}
                            required
                        />
                    </div>

                    {/* Instructions */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5 ml-1">Instructions (Persona)</label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="e.g. You are a strict military drill sergeant. Push me to my limits and accept no excuses!"
                            className="w-full p-3 rounded-xl bg-surface-2 border-2 border-border focus:border-primary outline-none transition-colors h-24 resize-none"
                            required
                        />
                        <p className="text-xs text-muted mt-1 ml-1">Describe how this coach should talk and behave.</p>
                    </div>

                    {/* Icon Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2 ml-1">Choose Icon</label>
                        <div className="grid grid-cols-8 gap-2">
                            {ICONS.map(icon => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setSelectedIcon(icon)}
                                    className={`aspect-square rounded-lg flex items-center justify-center text-lg transition-all ${selectedIcon === icon ? 'bg-surface-3 ring-2 ring-primary scale-110' : 'hover:bg-surface-2'}`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-2 ml-1">Theme Color</label>
                        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                            {COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-8 h-8 rounded-full flex-shrink-0 transition-transform ${selectedColor === color ? 'ring-2 ring-offset-2 ring-offset-surface ring-primary scale-110' : 'hover:scale-110'}`}
                                    style={{ background: color }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 rounded-xl bg-gradient-primary text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'Creating...' : (
                                <>
                                    <Sparkles size={18} /> Create Coach
                                </>
                            )}
                        </button>
                    </div>

                </form>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    height: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: var(--color-border);
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
}
