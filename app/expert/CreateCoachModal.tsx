'use client';

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

interface CreateCoachModalProps {
    onClose: () => void;
    onCreated: (coach: any) => void;
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#ec4899', '#ef4444', '#f59e0b', '#6366f1', '#14b8a6'];
const ICONS = ['🤖', '🧠', '💪', '🧘', '💜', '🗣️', '🛡️', '🎯', '🔄', '⭐', '🚀', '🔥'];

export default function CreateCoachModal({ onClose, onCreated }: CreateCoachModalProps) {
    const [name, setName] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !systemPrompt.trim()) {
            setError('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/coaches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    systemPrompt: systemPrompt.trim(),
                    color: selectedColor,
                    icon: selectedIcon
                })
            });
            const data = await res.json();

            if (data.success && data.data?.coach) {
                onCreated(data.data.coach);
                onClose();
            } else {
                setError(data.error || 'Failed to create coach');
            }
        } catch (err) {
            console.error('Failed to create coach', err);
            setError('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'var(--color-surface)',
                    width: '100%',
                    maxWidth: '380px',
                    maxHeight: 'calc(100vh - 40px)',
                    borderRadius: '20px',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                {/* Header - Fixed */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    background: 'var(--color-surface-2)',
                    borderBottom: '1px solid var(--color-border)',
                    flexShrink: 0
                }}>
                    <h2 style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--color-text)',
                        margin: 0
                    }}>
                        <Sparkles size={20} style={{ color: '#8b5cf6' }} />
                        Create Coach
                    </h2>
                    <button
                        onClick={onClose}
                        type="button"
                        style={{
                            padding: '6px',
                            borderRadius: '8px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            display: 'flex'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <form
                    onSubmit={handleSubmit}
                    style={{
                        padding: '16px 20px',
                        overflowY: 'auto',
                        flex: 1
                    }}
                >
                    {/* Preview */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '16px 20px',
                            borderRadius: '16px',
                            background: 'var(--color-surface-2)',
                            border: `2px solid ${selectedColor}`,
                            minWidth: '100px'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                background: selectedColor
                            }}>
                                {selectedIcon}
                            </div>
                            <span style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: 'var(--color-text)',
                                maxWidth: '80px',
                                textAlign: 'center',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}>
                                {name || 'Name'}
                            </span>
                        </div>
                    </div>

                    {/* Name */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text)' }}>
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Drill Sergeant"
                            maxLength={20}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                background: 'var(--color-surface-2)',
                                border: '2px solid var(--color-border)',
                                fontSize: '0.95rem',
                                color: 'var(--color-text)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Instructions */}
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text)' }}>
                            Personality
                        </label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Be strict. Push me hard. No excuses!"
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                background: 'var(--color-surface-2)',
                                border: '2px solid var(--color-border)',
                                fontSize: '0.9rem',
                                color: 'var(--color-text)',
                                outline: 'none',
                                resize: 'none',
                                height: '70px',
                                lineHeight: 1.4
                            }}
                        />
                    </div>

                    {/* Icons & Colors in a row */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text)' }}>
                                Icon
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                                {ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setSelectedIcon(icon)}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            background: selectedIcon === icon ? selectedColor : 'var(--color-surface-2)',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div style={{ width: '80px' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '6px', color: 'var(--color-text)' }}>
                                Color
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: '6px',
                                            background: color,
                                            border: selectedColor === color ? '2px solid var(--color-text)' : '2px solid transparent',
                                            cursor: 'pointer'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{ color: 'var(--color-error)', fontSize: '0.8rem', marginBottom: '12px', textAlign: 'center' }}>
                            {error}
                        </div>
                    )}

                    {/* Submit - Always visible */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            border: 'none',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                        }}
                    >
                        <Sparkles size={16} />
                        {isSubmitting ? 'Creating...' : 'Create Coach'}
                    </button>
                </form>
            </div>
        </div>
    );
}
