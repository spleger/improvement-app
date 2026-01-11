export const ICON_MAP: Record<string, string> = {
    // Domains
    'health': '💪',
    'fitness': '🏃',
    'mindfulness': '🧘',
    'skills': '🎸',
    'career': '💼',
    'relationships': '❤️',

    // Fallbacks if backend sends generic terms
    'dumbbell': '💪',
    'brain': '🧠',
    'heart': '❤️',
    'book': '📚',
    'money': '💰',
    'search': '🔍',
    'star': '⭐',

    // Habits
    'water': '💧',
    'sleep': '😴',
    'sun': '☀️',
    'moon': '🌙',
    'check': '✅',

    // Defaults
    'default': '🎯'
};

export function getIcon(iconName: string | undefined | null): string {
    if (!iconName) return ICON_MAP['default'];
    // If it's already an emoji (non-ASCII), return it
    if (/[^\u0000-\u007F]/.test(iconName)) return iconName;

    const key = iconName.toLowerCase().trim();
    return ICON_MAP[key] || ICON_MAP['default'];
}
