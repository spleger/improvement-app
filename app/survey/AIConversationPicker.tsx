'use client';

import Link from 'next/link';

const CONVERSATION_STYLES = [
    { id: 'general', name: 'General Coach', icon: '?', color: '#8b5cf6', description: 'Holistic transformation guidance' },
    { id: 'health', name: 'Health Coach', icon: '+', color: '#ef4444', description: 'Fitness and vitality advice' },
    { id: 'habits', name: 'Habits Coach', icon: '*', color: '#f59e0b', description: 'Build routine and consistency' },
    { id: 'emotional', name: 'Emotional Coach', icon: '~', color: '#ec4899', description: 'EQ and resilience support' },
    { id: 'motivation', name: 'Motivation Boost', icon: '!', color: '#10b981', description: 'Get inspired and re-energized' },
    { id: 'reflection', name: 'Guided Reflection', icon: '#', color: '#3b82f6', description: 'Reflect on your day and progress' },
];

export default function AIConversationPicker() {
    return (
        <div>
            <h2 className="heading-3" style={{ marginBottom: 'var(--spacing-lg)' }}>
                Choose your conversation style
            </h2>

            <div className="flex flex-col gap-md">
                {CONVERSATION_STYLES.map(style => (
                    <Link
                        key={style.id}
                        href={`/expert?coach=${style.id}`}
                        className="card"
                        style={{ textDecoration: 'none', display: 'block' }}
                    >
                        <div className="flex items-center gap-md">
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: style.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '1.5rem',
                                fontWeight: 'bold'
                            }}>
                                {style.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className="heading-5" style={{ fontWeight: 600 }}>{style.name}</div>
                                <div className="text-small text-muted">{style.description}</div>
                            </div>
                            <span style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)' }}>&rarr;</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
