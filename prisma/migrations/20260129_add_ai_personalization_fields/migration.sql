-- Add AI Voice Selection field
ALTER TABLE "UserPreferences" ADD COLUMN IF NOT EXISTS "voiceId" TEXT;

-- Add AI Personality Customization fields
ALTER TABLE "UserPreferences" ADD COLUMN IF NOT EXISTS "aiCustomName" TEXT;
ALTER TABLE "UserPreferences" ADD COLUMN IF NOT EXISTS "tonePreference" TEXT;
ALTER TABLE "UserPreferences" ADD COLUMN IF NOT EXISTS "rudeMode" BOOLEAN DEFAULT false;

-- Comment: voiceId stores OpenAI voice ID (alloy, ash, coral, echo, fable, onyx, nova, sage, shimmer)
-- Comment: aiCustomName stores custom name for AI coach (e.g., "Max", "Coach Aria")
-- Comment: tonePreference stores tone preference ("professional" | "friendly" | "casual")
-- Comment: rudeMode enables tough-love, no-excuses mode when true
