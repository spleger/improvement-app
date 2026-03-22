export interface Coach {
    id: string;
    name: string;
    icon: string;
    color: string;
    description: string;
    type: 'default' | 'goal' | 'custom';
    isGoalCoach?: boolean;
    systemPrompt?: string;
}

export const DEFAULT_COACHES: Coach[] = [
    { id: 'general', name: 'General', icon: '\u{1F9E0}', color: '#8b5cf6', description: 'Holistic transformation', type: 'default' },
    { id: 'health', name: 'Health', icon: '\u{1F4AA}', color: '#ef4444', description: 'Fitness & vitality', type: 'default' },
    { id: 'habits', name: 'Habits', icon: '\u{1F504}', color: '#f59e0b', description: 'Routine & consistency', type: 'default' },
    { id: 'emotional', name: 'Emotional', icon: '\u{1F49C}', color: '#ec4899', description: 'EQ & resilience', type: 'default' },
    { id: 'languages', name: 'Languages', icon: '\u{1F5E3}\uFE0F', color: '#3b82f6', description: 'Fluency & immersion', type: 'default' },
    { id: 'mobility', name: 'Mobility', icon: '\u{1F9D8}', color: '#10b981', description: 'Movement & flexibility', type: 'default' },
];
