# Design Feedback

## Visual & UI Polish

- **Completing/Deleting Skills/Goals:** The confirmation modals ("Are you sure...") look "terrible". They work functionally but need a visual overhaul to match a premium aesthetic.
- **Loading States:** The app needs proper loading indications when fetching data or processing.
  - Suggestion: Breathing animations, transitionary color fades (not just simple fading).
- **Icons:** General feedback that icons are "very basic". Needs nicer, better icons throughout (specifically mentioned for Expert Coach).

## Layout & UX

- **Habits Voice Lock:** The audio interface pops up at the very bottom. It should be more prominent, "positioned in front of the rest" or higher up to be the focal point.
- **Progress Page Navigation:** User mentioned navigation buttons "should not be down here". (Note: Check if this relates to the shifting nav bar bug or preference for different placement).
- **Voice Diary:**
  - Missing progress indicator when saving an entry. User perceives it as just "taking time" without feedback until "Entry saved" appears.

## Expert Coach

- **Suggestions UI:** The "example things to say" are currently too obstructive.
  - **Improvement:** Make it a single line right above the chat input.
  - **Interaction:** Allow swiping left/right to see more inspirations, saving vertical space.
- **Chat Interaction:**
  - **Typewriter Effect:** Responses should appear character-by-character or word-by-word, not appearing all at once.
  - **Scroll Anchoring:** Text generation should NOT auto-scroll the page. Keep the view anchored to the top of the new message so the user can read as it generates. User should choose when to scroll down.

## Profile

- **Goals Display:** (Positive) The display of current and completed goals is well-liked.
