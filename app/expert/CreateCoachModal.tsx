'use client';

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';

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
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)'
        }}>
            <div style={{
                background: 'var(--color-surface)',
                width: '100%',
                maxWidth: '420px',
                borderRadius: '24px',
                boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '20px 24px',
                    background: 'var(--color-surface-2)',
                    borderBottom: '1px solid var(--color-border)'
                }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--color-text)'
                    }}>
                        <Sparkles size={22} style={{ color: 'var(--color-primary)' }} />
                        Create Custom Coach
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px',
                            borderRadius: '12px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)'
                        }}
                    >
                        <X size={22} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
                    {/* Live Preview */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '20px 24px',
                            borderRadius: '20px',
                            background: 'var(--color-surface-2)',
                            border: `2px solid ${selectedColor}`,
                            boxShadow: `0 8px 32px ${selectedColor}30`,
                            minWidth: '140px'
                        }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '2rem',
                                background: selectedColor,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}>
                                {selectedIcon}
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    color: 'var(--color-text)',
                                    maxWidth: '120px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {name || 'Your Coach'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    Custom AI
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Name Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            marginBottom: '8px',
                            color: 'var(--color-text)'
                        }}>
                            Coach Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Drill Sergeant"
                            maxLength={25}
                            required
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                background: 'var(--color-surface-2)',
                                border: '2px solid var(--color-border)',
                                fontSize: '1rem',
                                color: 'var(--color-text)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Persona Instructions */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            marginBottom: '8px',
                            color: 'var(--color-text)'
                        }}>
                            Personality & Instructions
                        </label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Describe how this coach should behave. Example: 'You are a strict but caring military drill sergeant. Push me hard but celebrate my wins. No excuses allowed!'"
                            required
                            style={{
                                width: '100%',
                                padding: '14px 16px',
                                borderRadius: '12px',
                                background: 'var(--color-surface-2)',
                                border: '2px solid var(--color-border)',
                                fontSize: '0.95rem',
                                color: 'var(--color-text)',
                                outline: 'none',
                                resize: 'none',
                                height: '100px',
                                lineHeight: 1.5
                            }}
                        />
                    </div>

                    {/* Icon & Color Selection - Side by Side */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '20px',
                        marginBottom: '24px'
                    }}>
                        {/* Icons */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                marginBottom: '10px',
                                color: 'var(--color-text)'
                            }}>
                                Icon
                            </label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '6px'
                            }}>
                                {ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setSelectedIcon(icon)}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem',
                                            background: selectedIcon === icon ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
                                            border: selectedIcon === icon ? '2px solid var(--color-primary)' : '2px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colors */}
                        <div>
                            <label style={{
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 500,
                                marginBottom: '10px',
                                color: 'var(--color-text)'
                            }}>
                                Color
                            </label>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '8px'
                            }}>
                                {COLORS.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setSelectedColor(color)}
                                        style={{
                                            aspectRatio: '1',
                                            borderRadius: '10px',
                                            background: color,
                                            border: selectedColor === color ? '3px solid var(--color-text)' : '3px solid transparent',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                            boxShadow: selectedColor === color ? '0 0 0 2px var(--color-surface)' : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !name || !systemPrompt}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '14px',
                            background: 'var(--gradient-primary)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '1rem',
                            border: 'none',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting || !name || !systemPrompt ? 0.6 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)'
                        }}
                    >
                        <Sparkles size={18} />
                        {isSubmitting ? 'Creating...' : 'Create Coach'}
                    </button>
                </form>
            </div>
        </div>
    );
}
