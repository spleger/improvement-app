import { generateChallenge, chatWithExpert, transcribeAudio, analyzeRealityShift, SYSTEM_PROMPTS } from '../../lib/ai';
import { UserPrefs, Goal, Message } from '../../lib/types';
import OpenAI from 'openai';

// Mock OpenAI
const mockCreateChatCompletion = jest.fn();
const mockCreateTranscription = jest.fn();

jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => {
        return {
            chat: {
                completions: {
                    create: mockCreateChatCompletion,
                },
            },
            audio: {
                transcriptions: {
                    create: mockCreateTranscription,
                },
            },
        };
    });
});

describe('AI Service Layer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('generateChallenge', () => {
        it('returns structured JSON matching Challenge schema', async () => {
            const mockGoal: Goal = {
                id: '1',
                title: 'Run Marathon',
                userId: 'user1',
                description: 'Complete 42km',
                currentState: 'Couch potato',
                desiredState: 'Marathon runner',
                difficultyLevel: 5,
                realityShiftEnabled: false,
                status: 'active',
                startedAt: new Date(),
                targetDate: null,
                domainId: null,
                completedAt: null
            };

            const mockPrefs: UserPrefs = {
                preferredDifficulty: 7,
                focusAreas: ['endurance'],
                avoidAreas: ['swimming'],
                realityShiftEnabled: true,
                aiPersonality: 'tough_love'
            };

            const mockResponse = {
                title: 'Run 5km',
                description: 'Run 5km in under 30 mins',
                difficulty: 7,
                isRealityShift: true
            };

            mockCreateChatCompletion.mockResolvedValueOnce({
                choices: [{ message: { content: JSON.stringify(mockResponse) } }]
            });

            const result = await generateChallenge(mockPrefs, mockGoal);

            expect(result).toEqual(expect.objectContaining({
                title: 'Run 5km',
                difficulty: 7,
                isRealityShift: true
            }));

            expect(mockCreateChatCompletion).toHaveBeenCalledWith(expect.objectContaining({
                response_format: { type: 'json_object' }
            }));
        });
    });

    describe('chatWithExpert', () => {
        it('respects system prompt based on persona: tough_love', async () => {
            const messages: Message[] = [{ role: 'user', content: 'Help me' }];
            await chatWithExpert(messages, 'tough_love');

            expect(mockCreateChatCompletion).toHaveBeenCalledWith(expect.objectContaining({
                messages: expect.arrayContaining([
                    { role: 'system', content: SYSTEM_PROMPTS.TOUGH_LOVE }
                ])
            }));
        });

        it('respects system prompt based on persona: scientific', async () => {
            const messages: Message[] = [{ role: 'user', content: 'Help me' }];
            await chatWithExpert(messages, 'scientific');

            expect(mockCreateChatCompletion).toHaveBeenCalledWith(expect.objectContaining({
                messages: expect.arrayContaining([
                    { role: 'system', content: SYSTEM_PROMPTS.SCIENTIFIC }
                ])
            }));
        });
    });

    describe('transcribeAudio', () => {
        it('calls openai transcription with file', async () => {
            const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
            mockCreateTranscription.mockResolvedValueOnce({ text: 'Hello world' });

            const text = await transcribeAudio(mockBlob);

            expect(text).toBe('Hello world');
            expect(mockCreateTranscription).toHaveBeenCalledTimes(1);
        });
    });
});
