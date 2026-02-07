# Implementation Plan - Voice Chat Polish

Refining the `InterviewChat` (Voice-based Check-in) to drive user engagement through better UI/UX, matching the improvements made to `ExpertChat`.

## User Improvements

- **Maximize Screen Space**: Removing avatar icons to allow text to fill the width.
- **Better Keyboard Handling**: Implementing dynamic viewport resizing to prevent the "pushed up" effect when the keyboard opens on mobile.
- **Visual Clarity**: Ensuring the focus is on the conversation content.

## Proposed Changes

### `app/survey/InterviewChat.tsx`

#### [MODIFY] Layout & Logic

- **Port Viewport Logic**: granularly control height using `window.visualViewport` to handle mobile keyboards gracefully (copied from `ExpertChat`).
- **Remove Avatars**: Hide `message-avatar` elements for both user and assistant.
- **Maximize Bubbles**: Adjust CSS to allow message bubbles to take closer to 100% width.
- **Stable Scroll**: Ensure scrolling behaves naturally even when keyboard toggles.

#### [MODIFY] Styling

- Update `.chat-messages` to use the new `--keyboard-offset` variable.
- Update message bubble styles to remove left margins/padding reserved for avatars.

## Verification

- **Build**: `npm run build`
- **Manual**: Verify code structure matches the `ExpertChat` implementation which is known to work.
