# Functionality Feedback

## Bugs (Critical)

- **Navigation Inconsistency:**
  - **Scenario:** Go to Home -> Click generic "Progress".
  - **Issue:** Bottom navigation bar shifts layout. "Progress" moves to the right of Home, "Diary" appears, "Habits" (usually right of Home) disappears.
  - **Follow-up:** Clicking "Diary" brings "Habits" and "Progress" back, but "Diary" disappears.
  - **Expected:** Consistent navigation bar state. Items should not randomly shift or disappear/reappear inconsistently.
- **Habits Voice Lock:**
  - **Transcription:** Live transcription is broken. Displays "lots of recording" and acts buggy.
  - **Processing:** Loading/processing state hangs or looks bugged (needs indicator, but also simply doesn't work).
- **Challenge Library:**
  - **Success Criteria:** "See details" button is broken; shows no content.
  - **AI Generation:** "Generate more with AI" button does not work; challenges are not generated.
- **Home Screen - Goal/Challenge Display:** ✅ FIXED
  - Challenges now appear nested (indented) underneath their parent goal with a visual border-left hierarchy.
- **Voice Diary:**
  - **Transcription:** Logic seems to run in background, but the "Transcript edit if needed" text box remains empty.
  - **Insights:** The "Insights" section is empty. It should generate and display cool insights about the voice entry/journey.
- **Challenge Generator - Quality:**
  - **Issue:** Does not generate real, meaningful challenges. Even when selecting multiple challenges, only one very basic challenge is created.
  - **Current Behavior:** Generated challenges are trivial—essentially just rewording the goal's starting point and end point rather than creating actionable, progressive challenges.
  - **Expected:** Multiple diverse, actionable challenges that progressively build toward the goal.

## Workflow Improvements

- **Challenge Generator:**
  - **Issue:** Currently, you set a *number* of challenges and they are just created.
  - **Request:** Add a flow to "Accept" or "Decline" generated challenges (similar to the manual "Accept" flow in Challenge Library). Consider making this a setting (Auto-accept vs. Review).
- **Expert Coach:**
  - **Auto-selection:** When creating a custom expert/coach, it should automatically be selected/active upon creation completion.
- **Voice Diary:**
  - **Controls:** Missing "Delete", "Remove", or "Back" buttons in the interface.

## Missing Features / Data

- **Progress Page:**
  - **Current Day:** Needs a clear indicator (e.g., yellow highlight) of which day is the *current* day in the progress view.
- **Settings & Onboarding Parity:**
  - Many preferences selected during Onboarding are missing from the General Settings. Users need to be able to change these later:
    - Primary Challenge (Starting vs. Consistency)
    - Time investment per day
    - Challenges per day
    - Preferred challenge length
    - Best time for challenges
    - Reality Shift Mode
    - AI Personality
    - Scientific Basis toggle
    - Notification preferences
