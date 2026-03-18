# Plan 009: Live Voice Chat Fixes

## Issues

1. **AI responses too long** - Currently hardcoded to "2-3 sentences MAX" with max_tokens: 200. User wants responses that aim for ~5 sentences but can go up to 10, preferring the lower end.
2. **Slow TTS start** - 5-10 second delay before voice plays after AI responds.
3. **Diary voice transcript not capturing on mobile** - SpeechRecognition API unavailable on mobile Safari/Firefox. Whisper fallback only triggers on save, too late.
4. **Voice selection may not save correctly** - Settings require manual "Save Settings" click; no auto-save on voice selection change.

## Root Cause Analysis

### Issue 1: Response Length
Three places enforce the 2-3 sentence limit:
- **Frontend prefix** (`app/expert/live/page.tsx:288`): `[LIVE VOICE MODE - Reply in 2-3 short sentences MAX...]`
- **Server system prompt** (`app/api/expert/chat/stream/route.ts:72`): `CRITICAL: Keep ALL responses to 2-3 sentences maximum`
- **Token budget** (`app/api/expert/chat/stream/route.ts:85`): `max_tokens: 200` (hard cap)

Fix: Update all three to target 5 sentences (lower end), allow up to 10.

### Issue 2: TTS Latency
The current flow per sentence: AI streams text -> sentence boundary detected -> POST /api/tts (OpenAI API call ~1-3s) -> download wav blob -> decode -> play. Compounding delays:

1. **WAV format** - Uncompressed audio. A 5-second sentence = ~400KB wav vs ~20KB opus. Large downloads add latency.
2. **Full-sentence granularity** - Only splits on `.!?` followed by space. First sentence could be 20+ words before any audio starts.
3. **Sequential queue** - Each chunk waits for the previous to finish playing AND for its own TTS API call.
4. **No prefetch** - Next chunk's TTS isn't fetched until current chunk finishes playing.

Fix:
- Switch from `wav` to `opus` format (20x smaller, minimal quality difference on tts-1)
- Split on clause boundaries (commas, semicolons, colons, dashes) in addition to sentence boundaries, with a minimum length threshold
- Prefetch next TTS chunk while current one is playing
- Reduce minimum chunk length from 5 chars to allow shorter initial speech

### Issue 3: Diary Transcript on Mobile
The diary VoiceRecorder (`app/diary/VoiceRecorder.tsx`) uses browser `SpeechRecognition` as primary transcription. On mobile Safari/Firefox, this API doesn't exist. The Whisper fallback (line 229) only runs at save time, creating a UX gap: users see no transcript during recording and may think it's broken.

Fix:
- Detect if `SpeechRecognition` / `webkitSpeechRecognition` is available at mount time
- If unavailable, show a message indicating server-side transcription will be used on save
- Ensure the Whisper fallback path is robust (currently only checks `!finalTranscript`, should also handle empty-string case)

### Issue 4: Voice Selection Persistence
The SettingsForm uses `updatePref()` which only updates local state. The actual save requires clicking "Save Settings" button. Users may:
- Select a voice and navigate away without saving
- Not realize changes aren't persisted

Fix: Auto-save voice selection immediately when changed (debounced POST to /api/settings).

## Implementation

### File Changes

#### 1. `app/expert/live/page.tsx`
- **Line 288**: Update LIVE VOICE MODE prefix from "2-3 short sentences" to "around 5 sentences, up to 10 if needed"
- **Lines 306-342**: Improve sentence splitting to include clause boundaries for faster TTS start
- **Lines 150-242**: Add TTS prefetch logic - fetch next chunk while current plays

#### 2. `app/api/expert/chat/stream/route.ts`
- **Line 72**: Update system prompt from "2-3 sentences maximum" to "around 5 sentences, up to 10 if the topic requires depth"
- **Line 85**: Increase `max_tokens` from 200 to 800 for live mode

#### 3. `app/api/tts/route.ts`
- **Line 40**: Change `response_format` from `'wav'` to `'opus'`
- **Line 46**: Update Content-Type header from `audio/wav` to `audio/opus`

#### 4. `app/diary/VoiceRecorder.tsx`
- Add SpeechRecognition availability check at mount
- Show "Transcript will be generated after saving" banner when SpeechRecognition unavailable
- Ensure Whisper fallback handles edge cases (empty string, whitespace-only)

#### 5. `app/settings/SettingsForm.tsx`
- Add auto-save for voiceId changes (debounced)

## Testing Strategy

- Manual: Test live voice chat on desktop browser, verify response length is ~5 sentences
- Manual: Test TTS latency - first audio should start within 2-3 seconds
- Manual: Test diary recording on mobile Safari (or Chrome mobile emulator)
- Manual: Test voice selection - change voice, navigate away, return, verify selection persisted
- Existing unit tests: Run `npm test` to verify no regressions

## Architectural Review

- **Scalability**: Longer responses (5-10 sentences) increase AI and TTS API costs per interaction. The 800 max_tokens cap keeps this bounded.
- **Reliability**: opus format is well-supported in all modern browsers. Falling back to mp3 if needed.
- **Code health**: Changes are surgical - 5 files, no new dependencies, no schema changes.
