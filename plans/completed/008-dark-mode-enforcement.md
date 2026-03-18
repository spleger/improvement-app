# Plan 008: Dark Mode Enforcement & Visual Fixes

## Overview
Enforce dark mode as the only theme (remove light/system toggle) and fix all dark mode visual issues identified in the dark mode audit (`docs/DARK_MODE_AUDIT.md`).

## Requirements
- Dark mode is the only available theme -- no light mode toggle
- All pages have consistent dark theming with no light-mode artifacts
- Glassmorphism cards have visible borders
- Bottom nav is fully dark with readable labels
- Error pages respect dark mode
- Form inputs have visible borders
- Secondary text contrast improved throughout
- Progress calendar day numbers readable

---

## Task 1: Force Dark Mode & Remove Theme Toggle

### 1A. Simplify ThemeContext to always use dark mode

**File:** `app/ThemeContext.tsx`

**Changes:**
- Remove `Theme` type union (`'light' | 'dark' | 'system'`) -- hardcode to `'dark'`
- Remove `setTheme` from context (no longer needed externally for toggling)
- Remove localStorage read/write for theme preference
- Remove `window.matchMedia` system preference detection
- Always set `document.documentElement.setAttribute('data-theme', 'dark')` on mount
- Keep `currentTheme` as always `'dark'`
- Keep accent color functionality intact (that stays)

**Simplified logic:**
```typescript
// Remove Theme type, always dark
const [currentTheme] = useState<'light' | 'dark'>('dark');

useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    setMounted(true);
}, []);
```

**Keep the interface stable** so any code calling `useTheme()` still compiles:
- `theme` always returns `'dark'`
- `setTheme` becomes a no-op function `() => {}`
- `currentTheme` always returns `'dark'`

### 1B. Remove ThemeToggle component from Settings page

**File:** `app/settings/page.tsx`
- Line 6: Remove `import ThemeToggle from '../ThemeToggle';`
- Line 33: Remove `<ThemeToggle />` from JSX

**File:** `app/ThemeToggle.tsx`
- Delete the entire file -- it is no longer used anywhere

### 1C. Remove ThemeToggle from SettingsForm if referenced

**File:** `app/settings/SettingsForm.tsx` (check if it also references theme toggle)
- Remove any theme section/toggle rendering in the form

### 1D. Update layout.tsx to set initial data-theme

**File:** `app/layout.tsx`
- Line 33: Add `data-theme="dark"` to the `<html>` tag to prevent flash of light theme on initial load:
```tsx
<html lang="en" data-theme="dark" suppressHydrationWarning>
```

---

## Task 2: Fix Bottom Navigation Dark Theming

### 2A. Fix global nav-bottom styles in globals.css

**File:** `app/globals.css` (lines ~956-1010)

**Changes to `.nav-bottom`:**
- Change background to darker, more opaque value: `background: rgba(12, 12, 20, 0.95);`
- Change border-top to subtle: `border-top: 1px solid rgba(255, 255, 255, 0.06);`

**Changes to `.nav-item`:**
- Change default color from `var(--color-text-muted)` to `var(--color-text-secondary)` for better readability
- The muted value `#6c6c80` is too dark; secondary `#a0a0b0` is more readable

**Changes to `.nav-item:hover`:**
- Already uses `rgba(255, 255, 255, 0.05)` -- adequate

**Changes to `.nav-item.active`:**
- Already uses `var(--color-accent)` -- this is fine (teal)

Since these are global CSS styles, the changes affect both the global BottomNavigation component AND the inline nav-bottom instances.

### 2B. Fix BottomNavigation component inline styles

**File:** `app/components/BottomNavigation.tsx` (lines 114-246)

The component uses `<style jsx>` which overrides globals. Update:
- `.nav-bottom` background: `rgba(12, 12, 20, 0.95)` (line 120)
- `.nav-bottom` border-top: `1px solid rgba(255, 255, 255, 0.06)` (line 121)
- `.nav-item` color: change from `var(--color-text-secondary)` to a brighter value, or keep but ensure `--color-text-secondary` is bright enough (it's `#a0a0b0` which should be fine)
- `.nav-item.active` color: verify it uses accent color
- `.tracking-submenu-dropdown` background: match the darker nav background

---

## Task 3: Fix Glassmorphism Card Border Visibility

### 3A. Increase glass border opacity in dark mode CSS variables

**File:** `app/globals.css` (line 90)

**Change:**
```css
/* Before */
--glass-border: 1px solid rgba(255, 255, 255, 0.1);

/* After */
--glass-border: 1px solid rgba(255, 255, 255, 0.15);
```

### 3B. Increase general border opacity in dark mode

**File:** `app/globals.css` (line 73)

**Change:**
```css
/* Before */
--color-border: rgba(255, 255, 255, 0.1);

/* After */
--color-border: rgba(255, 255, 255, 0.12);
```

### 3C. Add subtle outer glow to card-glass for better definition

**File:** `app/globals.css` (lines 327-335)

Add a dark-mode-specific rule after the existing `.card-glass` block:
```css
[data-theme="dark"] .card-glass {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.07);
}
```

This adds an inset-like 1px ring using box-shadow (no layout shift, purely visual).

---

## Task 4: Create Dark-Themed Error Page

### 4A. Create `app/error.tsx`

**New file:** `app/error.tsx`

This is a client component (required by Next.js for error boundaries). It should:
- Use `'use client'` directive
- Accept `{ error, reset }` props (Next.js error boundary contract)
- Render with a dark background matching `--color-background` (#121212)
- Show a user-friendly error message
- Provide a "Try Again" button that calls `reset()`
- Provide a "Go Home" link
- Use inline styles (no CSS variable dependency since the error might occur before ThemeProvider mounts)

**Template:**
```tsx
'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div style={{
            minHeight: '100vh',
            background: '#121212',
            color: '#f0f0f5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            textAlign: 'center',
        }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
                Something went wrong
            </h2>
            <p style={{ color: '#a0a0b0', marginBottom: '2rem', maxWidth: '300px' }}>
                An unexpected error occurred. Please try again.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={reset}
                    style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}
                >
                    Try Again
                </button>
                <a
                    href="/"
                    style={{
                        padding: '12px 24px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.1)',
                        color: '#f0f0f5',
                        textDecoration: 'none',
                        fontWeight: 500,
                    }}
                >
                    Go Home
                </a>
            </div>
        </div>
    );
}
```

### 4B. Create `app/not-found.tsx`

**New file:** `app/not-found.tsx`

Similar to error.tsx but for 404 pages:
- Dark background with centered content
- "Page Not Found" heading
- "Go Home" link
- Uses inline styles (hardcoded dark colors) for reliability

---

## Task 5: Fix Habits Page Header Banner

### 5A. Investigate the actual light background source

**File:** `app/habits/page.tsx`

The `.habits-summary` (line 335-346) uses `var(--color-surface)` which in dark mode is `rgba(30, 30, 40, 0.7)` -- this should already be dark. The PageHeader component at `app/components/PageHeader.tsx` uses the `.page-header-styled` class.

The issue is likely that the PageHeader itself has no explicit background (it inherits from the page), but visually the entire top section of the habits page (header + summary card) appears to have a lighter background. Check if there's a wrapper or parent element with a light background.

**Likely fix:** The `.page-header-styled` class (globals.css line 1607) has no background set, meaning it's transparent. But the habits page may be wrapping it in a container with a background. Check the habits page JSX for any wrapper with `background` or `className` that would create the light banner effect.

**If the PageHeader itself needs a dark background, add:**
```css
[data-theme="dark"] .page-header-styled {
    background: transparent;
}
```

Or if a wrapper `div` in habits/page.tsx is causing it, remove its background.

---

## Task 6: Fix Profile Icon in Top Navigation

**File:** `app/components/TopNavigation.tsx` (lines 124-143)

The profile icon button uses `background: var(--color-surface)` which in dark mode is `rgba(30, 30, 40, 0.7)`. The issue is likely the visual appearance of the circular button -- it may look too light compared to the dark header.

**Fix:** Change the profile button background to a darker value:
```css
background: rgba(255, 255, 255, 0.08);
```
And ensure the border is subtle:
```css
border: 1px solid rgba(255, 255, 255, 0.1);
```

---

## Task 7: Fix Form Input Borders

**File:** `app/globals.css` (lines 839-857)

**Current:** `border: 2px solid var(--color-surface);` -- in dark mode this is `rgba(30, 30, 40, 0.7)` which is nearly invisible against `--color-background: #121212`.

**Fix:** Add a dark-mode-specific override:
```css
[data-theme="dark"] .form-input {
    border-color: rgba(255, 255, 255, 0.15);
}

[data-theme="dark"] .form-input:focus {
    border-color: var(--color-accent);
}
```

---

## Task 8: Improve Secondary Text Contrast

**File:** `app/globals.css` (lines 76-77)

**Current dark mode values:**
- `--color-text-secondary: #a0a0b0;` (acceptable)
- `--color-text-muted: #6c6c80;` (too dark -- hard to read)

**Fix:** Bump `--color-text-muted` slightly brighter:
```css
--color-text-muted: #8888a0;
```

This improves readability of muted labels throughout the app (nav labels, subtitle text, hint text) while still being visually distinct from secondary text.

---

## Task 9: Fix Progress Calendar Day Numbers

**File:** `app/progress/page.tsx`

Find the calendar day rendering section. Day numbers for non-completed/non-skipped cells use `var(--color-text-muted)`. With the fix in Task 8 (bumping muted to `#8888a0`), this should already be improved.

**Additional fix if needed:** For calendar day text specifically, override to use `var(--color-text-secondary)` instead of `var(--color-text-muted)` for better readability on the dark calendar grid.

---

## Task 10: Remove Duplicate Bottom Navigation

Several pages embed their own `<nav className="nav-bottom">` even though the global `BottomNavigation` component is already rendered in `layout.tsx` (line 40).

### Pages with duplicate nav to clean up:

**File:** `app/settings/page.tsx` (lines 38-47)
- Remove the entire `<nav className="nav-bottom">...</nav>` block

**File:** `app/challenges/page.tsx` (lines ~97-106)
- Remove the embedded nav-bottom block

**File:** `app/challenges/browse/page.tsx` (lines ~36-45)
- Remove the embedded nav-bottom block

**File:** `app/profile/page.tsx` (lines 5, 134)
- Remove `import BottomNavigation` (line 5)
- Remove `<BottomNavigation />` (line 134)

---

## Task 11: Remove Light Mode CSS Variables (Cleanup)

Since light mode is no longer available, merge the light `:root` variables into `[data-theme="dark"]` or just make `:root` use the dark values directly.

**Approach:** Move the dark theme values into `:root` and remove the `[data-theme="dark"]` block. Keep `data-theme="dark"` on the HTML element for any inline code that checks it, but the CSS can be simplified.

**Recommended approach (safer):** Keep the current structure (`:root` for light + `[data-theme="dark"]` override) but ensure `data-theme="dark"` is always set. This minimizes risk of breaking anything. The light mode values become dead code but are harmless. Can be cleaned up in a later pass.

---

## Implementation Order

Execute tasks in this order (dependencies noted):

1. **Task 1** -- Force dark mode (ThemeContext, ThemeToggle removal, layout.tsx) -- foundational, do first
2. **Task 11** -- Keep light CSS for now (skip full cleanup, just ensure dark is always set)
3. **Task 8** -- Improve text contrast (global CSS variable change, affects many pages)
4. **Task 3** -- Fix glassmorphism card borders (global CSS, affects many pages)
5. **Task 7** -- Fix form input borders (global CSS)
6. **Task 2** -- Fix bottom nav dark theming (component + global CSS)
7. **Task 10** -- Remove duplicate bottom navs (4 files)
8. **Task 5** -- Fix habits page header banner
9. **Task 6** -- Fix profile icon in top nav
10. **Task 9** -- Fix progress calendar day numbers (may already be fixed by Task 8)
11. **Task 4** -- Create error.tsx and not-found.tsx (new files, independent)

---

## Testing Strategy

### Manual Visual Testing (Primary)
After each task, deploy to Vercel preview and verify in Playwright:
1. Every page renders with dark background (no white flashes)
2. All text is readable with adequate contrast
3. Card borders are visible
4. Bottom nav is consistently dark with readable labels
5. No duplicate bottom navs on /profile, /settings, /challenges
6. Error pages show dark-themed error UI
7. Login/register form fields have visible borders

### Build Verification
- Run `npx next build` before pushing (catches TypeScript errors Vercel would reject)
- Ensure no compile errors from removing ThemeToggle references

### Automated Tests
- Existing Jest tests should still pass (theme context mock may need updating if tests reference `setTheme`)
- Check `__tests__/` for any tests that exercise ThemeContext or ThemeToggle

### Regression Checks
- Accent color system still works (independent of theme)
- All pages load without JavaScript errors
- No flash of unstyled/light content on page load (data-theme="dark" on `<html>` prevents this)

---

## Definition of Done

- [ ] Dark mode is the only theme -- no toggle visible in Settings
- [ ] `data-theme="dark"` is set on `<html>` tag in layout.tsx
- [ ] ThemeToggle.tsx is deleted
- [ ] ThemeContext always applies dark mode
- [ ] Bottom nav has darker background and readable labels on all pages
- [ ] Glassmorphism card borders are visible (opacity increased)
- [ ] Muted text contrast bumped from #6c6c80 to #8888a0
- [ ] Form input borders visible in dark mode
- [ ] Custom error.tsx with dark background exists
- [ ] Custom not-found.tsx with dark background exists
- [ ] No duplicate bottom navs on /profile, /settings, /challenges, /challenges/browse
- [ ] Habits page header has consistent dark styling
- [ ] Profile icon in top nav styled for dark mode
- [ ] Progress calendar day numbers readable
- [ ] `npx next build` passes
- [ ] Existing tests pass
- [ ] Visual verification via Playwright on deployed preview

---

## Risk Assessment

**Low risk overall.** All changes are CSS-level adjustments or component removal. The biggest risk is:

1. **Flash of light content** -- mitigated by setting `data-theme="dark"` on the `<html>` tag server-side in layout.tsx
2. **Breaking existing tests** -- low risk, but check if any tests mock ThemeContext and assert on `setTheme` behavior
3. **Removing duplicate navs** -- these pages may lose their nav styling if the global nav doesn't reach them (but it does, since it's in layout.tsx)

**Rollback:** All changes are easily reversible via git since they're CSS/component edits.
