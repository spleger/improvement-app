'use client';

import { MiniStatChart } from '@/components/Charts';

// Pillar type definitions for the 4-quadrant layout
export interface PillarData {
    id: 'soul' | 'mind' | 'body' | 'goals';
    icon: string;
    title: string;
    value: number | string;
    label: string;
    sublabel?: string;
    sparklineData?: Array<{ value: number; date?: string }>;
    sparklineColor?: string;
}

// Pillar colors matching the CSS classes in globals.css
const PILLAR_COLORS: Record<PillarData['id'], string> = {
    soul: '#a855f7',    // Purple for soul/mood
    mind: '#0d9488',    // Teal for mind/motivation
    body: '#10b981',    // Green for body/energy
    goals: '#f59e0b',   // Orange/fire for goals
};

interface PillarCardProps {
    pillar: PillarData;
}

export function PillarCard({ pillar }: PillarCardProps) {
    const sparklineColor = pillar.sparklineColor || PILLAR_COLORS[pillar.id];

    return (
        <div className={`pillar-card pillar-${pillar.id}`}>
            <div className="pillar-header">
                <span className="pillar-icon">{pillar.icon}</span>
                <span className="pillar-title">{pillar.title}</span>
            </div>
            <div className="pillar-content">
                <div className="pillar-value">{pillar.value}</div>
                <div className="pillar-label">{pillar.label}</div>
                {pillar.sublabel && (
                    <div className="pillar-sublabel">{pillar.sublabel}</div>
                )}
            </div>
            {/* Mini sparkline chart */}
            <div className="pillar-sparkline" style={{ marginTop: 'var(--spacing-sm)' }}>
                <MiniStatChart
                    data={pillar.sparklineData || []}
                    color={sparklineColor}
                    height={36}
                    showGradient={true}
                />
            </div>
        </div>
    );
}

interface PillarGridProps {
    pillars: PillarData[];
}

export function PillarGrid({ pillars }: PillarGridProps) {
    return (
        <div className="pillar-grid">
            {pillars.map((pillar) => (
                <PillarCard key={pillar.id} pillar={pillar} />
            ))}
        </div>
    );
}

export default PillarCard;
