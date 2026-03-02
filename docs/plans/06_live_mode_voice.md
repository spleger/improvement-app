# Live Mode Voice Chat - Solution Architecture

Implementing a sophisticated, hands-free "Live Mode" for the Expert Coach using client-side Voice Activity Detection (VAD) and intelligent state management.

## Goals

1. **Hands-Free Interaction**: Eliminate the need to tap "Record" for every turn.
2. **Natural Flow**: Allow the user to drift into thought (silence) without cutting off too early, but detect when they are done.
3. **Interruption**: Allow the user to interrupt the AI by simply speaking over it.
4. **Visual Feedback**: A reactive "Orb" interface that pulses with voice intensity.

## Architecture

### 1. Client-Side VAD (Voice Activity Detection)

We will implement a custom `useVAD` hook using the Web Audio API (`AudioContext` and `AnalyserNode`) to avoid heavy external dependencies.

**Logic:**

- **Energy Calculation**: Compute Root Mean Square (RMS) of audio input frames.
- **Dynamic Thresholding**: Adaptation to background noise levels (optional, or tunable constants).
- **State Transition**:
  - `Silence` -> `Speech`: Energy > `SPEECH_THRESHOLD` for `START_WINDOW` (e.g., 200ms).
  - `Speech` -> `Silence`: Energy < `SILENCE_THRESHOLD` for `END_WINDOW` (e.g., 1000ms).

### 2. State Machine (`LiveVoiceChat`)

Refining the existing `OrbState` to handle automatic transitions.

| State | Trigger | Next State | Action |
| :--- | :--- | :--- | :--- |
| **Idle** | VAD: Speech Detected | **Recording** | Start accumulating audio chunks. |
| **Recording** | VAD: Silence Detected | **Processing** | Stop recording, send to API. |
| **Processing** | API Response | **Speaking** | Play TTS audio. |
| **Speaking** | VAD: Speech Detected | **Recording** | **INTERRUPT**: Stop TTS, start recording immediately. |

### 3. Backend (optimizations)

- **Current**: `POST /api/expert/chat/stream` -> Text Stream -> TTS.
- **Unchanged**: The current streaming architecture is sufficient for this phase. The latency win comes from the frontend VAD removing the "Tap to Stop" friction.

## Implementation Steps

1. **Create `hooks/useVAD.ts`**:
    - Implement AudioContext setup.
    - Implement RMS calculation.
    - Implement speech/silence timers.
    - Return `isSpeaking`, `volume` (for visualization).

2. **Enhance `app/expert/live/page.tsx`**:
    - Integrate `useVAD`.
    - Update `handleOrbTap` to be a manual override/mute toggle.
    - Implement interruption logic in the `useEffect` listening to `isSpeaking`.
    - **Visualization**: Use the VAD `volume` to drive the Orb's scale/opacity.

3. **Refine UI**:
    - Remove "Tap to Speak" text when in Hands-free mode.
    - Add a "Mic Active" indicator.

## Verification Plan

1. **Quiet Environment Test**: Verify VAD triggers correctly on normal speech.
2. **Noise Test**: Ensure background noise doesn't trigger false positives (tune threshold).
3. **Interruption Test**: Speak while AI is talking; verify TTS stops instantly.
4. **iOS Safari Test**: Verify AudioContext resumes correctly (user interaction requirement).
