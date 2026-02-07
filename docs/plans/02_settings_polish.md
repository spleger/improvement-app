# Implementation Plan - Settings & Preferences Polish

This plan addresses the "Option A" feedback from Feb 7, focusing on the Settings UI.

## User Review Required

> [!IMPORTANT]
> **Breaking Change**: The "AI Personality Customization" section (Custom Name, Tone, Rude Mode) will be removed in favor of the single "AI Personality" selection (Encouraging, Tough Love, Scientific, Casual). The `rudeMode` boolean will simply be ignored or mapped from `aiPersonality === 'tough-love'` in the future.

## Proposed Changes

### Settings UI Improvements

#### [MODIFY] [SettingsForm.tsx](file:///c:/Users/spleg/IdeaProjects/ImprovementApp/app/settings/SettingsForm.tsx)

1. **Challenge Settings Visibility**:
    * **Slider**: Add custom CSS to make the "Preferred Difficulty" slider thumb larger and the track thicker/more visible.
    * **Buttons (Challenges Per Day)**: Add explicit `border` and `background` styles to the numeric buttons `[1, 2, 3, 5]` to ensure they look like clickable boxes (outlines).
    * **Time Selection**: Ensure "Best Time" buttons also have clear outlines.

2. **Duplicate Personality Removal**:
    * **Keep**: The "AI Personality" section (Encouraging, Tough Love, Scientific, Casual).
    * **Remove**: The "AI Personality Customization" section (Custom AI Name, Tone Preference, Rude Mode).
    * **Cleanup**: Remove unused state variables (`aiCustomName`, `tonePreference`, `rudeMode`) from the `Preferences` interface and `DEFAULT_PREFS` if they remain unused in the form. (Note: They might still exist in DB schema, but we'll stop displaying them).

3. **Voice Selection Fix**:
    * Verify `voiceId` state update logic.
    * Ensure the button click handler properly updates `prefs.voiceId`.
    * Ensure the visual selection state (border highlight) is working.
    * (Self-Correction): The logic looks correct in code, but I will simplify the button structure to ensure no z-index or layout issues prevent clicking.

4. **Global Styles**:
    * Add `.custom-slider` class in `app/globals.css` for the range input styling.

### CSS Changes

#### [MODIFY] [globals.css](file:///c:/Users/spleg/IdeaProjects/ImprovementApp/app/globals.css)

* Add `.slider` and `.slider::-webkit-slider-thumb` styles to increase visibility.

## Verification Plan

### Automated Tests

* `npm run build` to ensure no type errors from removing preferences fields (if any).

### Manual Verification

* Verify the Settings page loads.
* Check that "Challenges Per Day" buttons have borders.
* Check that "Difficulty" slider is larger.
* Confirm only one "AI Personality" section exists.
* Confirm Voice Selection buttons update visually when clicked.
