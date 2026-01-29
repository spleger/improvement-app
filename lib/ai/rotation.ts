/**
 * Daily Focus Rotation Module
 *
 * Provides deterministic daily focus theme rotation using modulo arithmetic.
 * Each day presents a different focus theme in AI interactions.
 */

export interface FocusTheme {
    id: string;
    name: string;
    prompt: string;
}

/**
 * Available focus themes that rotate daily.
 * 7 themes = weekly cycle, each day of the week gets a different theme.
 */
export const FOCUS_THEMES: FocusTheme[] = [
    { id: 'discipline', name: 'Discipline', prompt: 'Today focus on building discipline and consistency.' },
    { id: 'gratitude', name: 'Gratitude', prompt: 'Today reflect on what you are grateful for.' },
    { id: 'growth', name: 'Growth', prompt: 'Today push yourself to learn something new.' },
    { id: 'connection', name: 'Connection', prompt: 'Today focus on meaningful relationships.' },
    { id: 'energy', name: 'Energy', prompt: 'Today prioritize your physical and mental energy.' },
    { id: 'reflection', name: 'Reflection', prompt: 'Today take time for introspection and self-awareness.' },
    { id: 'action', name: 'Action', prompt: 'Today bias toward taking action, even imperfect action.' },
];

/**
 * Calculate the day of year (1-365/366).
 * Uses UTC to ensure consistency across timezones.
 */
export function getDayOfYear(date: Date = new Date()): number {
    const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
    const diff = date.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24; // milliseconds in a day
    return Math.floor(diff / oneDay);
}

/**
 * Get the daily focus theme based on the current date.
 * Uses modulo arithmetic to cycle through themes (dayOfYear % themes.length).
 *
 * The rotation is deterministic - the same day will always return the same theme.
 *
 * @param date - Optional date to get focus for (defaults to current date)
 * @returns The focus theme for the given day
 */
export function getDailyFocus(date: Date = new Date()): FocusTheme {
    const dayOfYear = getDayOfYear(date);
    return FOCUS_THEMES[dayOfYear % FOCUS_THEMES.length];
}

/**
 * Get all available focus themes.
 * Useful for displaying theme options or previewing the rotation.
 */
export function getAllFocusThemes(): FocusTheme[] {
    return [...FOCUS_THEMES];
}

/**
 * Get the focus theme for a specific day offset from today.
 * Positive values = future days, negative values = past days.
 *
 * @param daysOffset - Number of days from today (e.g., 1 for tomorrow, -1 for yesterday)
 * @returns The focus theme for that day
 */
export function getFocusForOffset(daysOffset: number): FocusTheme {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return getDailyFocus(date);
}
