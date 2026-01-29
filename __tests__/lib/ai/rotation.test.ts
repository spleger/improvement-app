import {
    getDailyFocus,
    getDayOfYear,
    getAllFocusThemes,
    getFocusForOffset,
    FOCUS_THEMES,
    FocusTheme
} from '../../../lib/ai/rotation';

describe('Daily Focus Rotation Module', () => {
    describe('FOCUS_THEMES constant', () => {
        it('has exactly 7 themes for weekly cycle', () => {
            expect(FOCUS_THEMES.length).toBe(7);
        });

        it('each theme has required properties', () => {
            FOCUS_THEMES.forEach((theme) => {
                expect(theme).toHaveProperty('id');
                expect(theme).toHaveProperty('name');
                expect(theme).toHaveProperty('prompt');
                expect(typeof theme.id).toBe('string');
                expect(typeof theme.name).toBe('string');
                expect(typeof theme.prompt).toBe('string');
            });
        });

        it('all theme ids are unique', () => {
            const ids = FOCUS_THEMES.map((t) => t.id);
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(FOCUS_THEMES.length);
        });

        it('all themes have non-empty values', () => {
            FOCUS_THEMES.forEach((theme) => {
                expect(theme.id.length).toBeGreaterThan(0);
                expect(theme.name.length).toBeGreaterThan(0);
                expect(theme.prompt.length).toBeGreaterThan(0);
            });
        });
    });

    describe('getDayOfYear', () => {
        it('returns 1 for January 1st', () => {
            const jan1 = new Date(Date.UTC(2024, 0, 1)); // January 1, 2024
            expect(getDayOfYear(jan1)).toBe(1);
        });

        it('returns 32 for February 1st (31 days in January + 1)', () => {
            const feb1 = new Date(Date.UTC(2024, 1, 1)); // February 1, 2024
            expect(getDayOfYear(feb1)).toBe(32);
        });

        it('returns 366 for December 31st in a leap year', () => {
            const dec31LeapYear = new Date(Date.UTC(2024, 11, 31)); // December 31, 2024 (leap year)
            expect(getDayOfYear(dec31LeapYear)).toBe(366);
        });

        it('returns 365 for December 31st in a non-leap year', () => {
            const dec31NonLeapYear = new Date(Date.UTC(2023, 11, 31)); // December 31, 2023 (non-leap year)
            expect(getDayOfYear(dec31NonLeapYear)).toBe(365);
        });

        it('uses UTC to ensure timezone consistency', () => {
            // Create dates at midnight UTC - should give consistent results
            const date1 = new Date(Date.UTC(2024, 5, 15, 0, 0, 0)); // June 15, 2024 00:00 UTC
            const date2 = new Date(Date.UTC(2024, 5, 15, 23, 59, 59)); // June 15, 2024 23:59 UTC

            expect(getDayOfYear(date1)).toBe(getDayOfYear(date2));
        });
    });

    describe('getDailyFocus', () => {
        it('returns a valid FocusTheme object', () => {
            const result = getDailyFocus();

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('prompt');
        });

        it('is deterministic - same date always returns same theme', () => {
            const testDate = new Date(Date.UTC(2024, 5, 15)); // June 15, 2024

            const result1 = getDailyFocus(testDate);
            const result2 = getDailyFocus(testDate);
            const result3 = getDailyFocus(testDate);

            expect(result1).toEqual(result2);
            expect(result2).toEqual(result3);
        });

        it('returns theme from FOCUS_THEMES array', () => {
            const result = getDailyFocus();

            const themeIds = FOCUS_THEMES.map((t) => t.id);
            expect(themeIds).toContain(result.id);
        });

        it('cycles through all 7 themes over 7 consecutive days', () => {
            const startDate = new Date(Date.UTC(2024, 0, 1)); // January 1, 2024
            const themesOverWeek: FocusTheme[] = [];

            for (let i = 0; i < 7; i++) {
                const date = new Date(startDate);
                date.setUTCDate(date.getUTCDate() + i);
                themesOverWeek.push(getDailyFocus(date));
            }

            // All 7 themes should appear in a 7-day cycle
            const themeIds = new Set(themesOverWeek.map((t) => t.id));
            expect(themeIds.size).toBe(7);
        });

        it('repeats the same theme after 7 days', () => {
            const startDate = new Date(Date.UTC(2024, 0, 1)); // January 1, 2024
            const sevenDaysLater = new Date(Date.UTC(2024, 0, 8)); // January 8, 2024

            const theme1 = getDailyFocus(startDate);
            const theme2 = getDailyFocus(sevenDaysLater);

            expect(theme1).toEqual(theme2);
        });

        it('different dates return (potentially) different themes', () => {
            const date1 = new Date(Date.UTC(2024, 0, 1));
            const date2 = new Date(Date.UTC(2024, 0, 2));

            const theme1 = getDailyFocus(date1);
            const theme2 = getDailyFocus(date2);

            // Consecutive days should have different themes
            expect(theme1.id).not.toEqual(theme2.id);
        });

        it('uses modulo arithmetic correctly for theme selection', () => {
            // Day 1 should give index 1 % 7 = 1
            const jan1 = new Date(Date.UTC(2024, 0, 1));
            const dayOfYear = getDayOfYear(jan1);
            const expectedIndex = dayOfYear % FOCUS_THEMES.length;

            const result = getDailyFocus(jan1);

            expect(result).toEqual(FOCUS_THEMES[expectedIndex]);
        });
    });

    describe('getAllFocusThemes', () => {
        it('returns a copy of FOCUS_THEMES array', () => {
            const result = getAllFocusThemes();

            expect(result).toEqual(FOCUS_THEMES);
            expect(result).not.toBe(FOCUS_THEMES); // Should be a copy, not same reference
        });

        it('returns array of valid FocusTheme objects', () => {
            const result = getAllFocusThemes();

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(7);

            result.forEach((theme) => {
                expect(theme).toHaveProperty('id');
                expect(theme).toHaveProperty('name');
                expect(theme).toHaveProperty('prompt');
            });
        });

        it('modifying returned array does not affect original', () => {
            const result = getAllFocusThemes();
            const originalLength = FOCUS_THEMES.length;

            result.push({ id: 'test', name: 'Test', prompt: 'Test prompt' });

            expect(FOCUS_THEMES.length).toBe(originalLength);
        });
    });

    describe('getFocusForOffset', () => {
        it('returns todays theme for offset 0', () => {
            const todayTheme = getDailyFocus(new Date());
            const offsetTheme = getFocusForOffset(0);

            expect(offsetTheme).toEqual(todayTheme);
        });

        it('returns tomorrows theme for offset 1', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowTheme = getDailyFocus(tomorrow);

            const offsetTheme = getFocusForOffset(1);

            expect(offsetTheme.id).toBe(tomorrowTheme.id);
        });

        it('returns yesterdays theme for offset -1', () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayTheme = getDailyFocus(yesterday);

            const offsetTheme = getFocusForOffset(-1);

            expect(offsetTheme.id).toBe(yesterdayTheme.id);
        });

        it('handles large positive offsets', () => {
            const result = getFocusForOffset(365);

            // Should still return a valid theme
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('prompt');
        });

        it('handles large negative offsets', () => {
            const result = getFocusForOffset(-365);

            // Should still return a valid theme
            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('prompt');
        });

        it('offset of 7 returns same theme as today (weekly cycle)', () => {
            const todayTheme = getFocusForOffset(0);
            const weekLaterTheme = getFocusForOffset(7);

            expect(todayTheme.id).toBe(weekLaterTheme.id);
        });

        it('offset of -7 returns same theme as today (weekly cycle)', () => {
            const todayTheme = getFocusForOffset(0);
            const weekAgoTheme = getFocusForOffset(-7);

            expect(todayTheme.id).toBe(weekAgoTheme.id);
        });
    });

    describe('Integration: Theme Rotation Predictability', () => {
        it('produces predictable sequence for any starting date', () => {
            // Pick an arbitrary date and verify the sequence is predictable
            const startDate = new Date(Date.UTC(2025, 2, 15)); // March 15, 2025
            const sequence: string[] = [];

            for (let i = 0; i < 14; i++) {
                const date = new Date(startDate);
                date.setUTCDate(date.getUTCDate() + i);
                sequence.push(getDailyFocus(date).id);
            }

            // First 7 should equal second 7 (weekly repetition)
            expect(sequence.slice(0, 7)).toEqual(sequence.slice(7, 14));
        });

        it('same calendar date in leap vs non-leap year has different day-of-year after February', () => {
            // March 1st has different day-of-year values because Feb has 29 days in leap year
            const march1_2024 = new Date(Date.UTC(2024, 2, 1)); // Leap year
            const march1_2025 = new Date(Date.UTC(2025, 2, 1)); // Non-leap year

            const dayOfYear2024 = getDayOfYear(march1_2024);
            const dayOfYear2025 = getDayOfYear(march1_2025);

            // March 1 in leap year is day 61 (31 Jan + 29 Feb + 1)
            // March 1 in non-leap year is day 60 (31 Jan + 28 Feb + 1)
            expect(dayOfYear2024).toBe(61);
            expect(dayOfYear2025).toBe(60);
            expect(dayOfYear2024).not.toBe(dayOfYear2025);
        });
    });
});
