import { UserPrefs, Goal, Message } from '../../lib/types';

// Create mock functions and store them on a module-level object that survives hoisting
const mockFns = {
    chatCreate: jest.fn(),
    audioCreate: jest.fn()
};

// Use a factory function that doesn't reference external variables
jest.mock('openai', () => {
    // Define mocks directly in the factory
    const chatCreate = jest.fn();
    const audioCreate = jest.fn();

    // Expose them for test access via the module
    const MockOpenAI = jest.fn().mockImplementation(() => ({
        chat: {
            completions: {
                create: chatCreate,
            },
        },
        audio: {
            transcriptions: {
                create: audioCreate,
            },
        },
    }));

    // Attach mock functions to constructor for test access
    (MockOpenAI as any).__mocks = { chatCreate, audioCreate };

    return MockOpenAI;
});

// Import after mock setup
import OpenAI from 'openai';
import { generateChallenge, chatWithExpert, transcribeAudio, SYSTEM_PROMPTS } from '../../lib/ai';

// Get references to the mocks
const getMocks = () => (OpenAI as any).__mocks as { chatCreate: jest.Mock; audioCreate: jest.Mock };

describe('AI Service Layer', () => {
    beforeEach(() => {
        const mocks = getMocks();
        mocks.chatCreate.mockReset();
        mocks.audioCreate.mockReset();
    });

    describe('generateChallenge', () => {
        it('returns structured JSON matching Challenge schema', async () => {
            const mocks = getMocks();

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

            mocks.chatCreate.mockResolvedValueOnce({
                choices: [{ message: { content: JSON.stringify(mockResponse) } }]
            });

            const result = await generateChallenge(mockPrefs, mockGoal);

            expect(result).toEqual(expect.objectContaining({
                title: 'Run 5km',
                difficulty: 7,
                isRealityShift: true
            }));

            expect(mocks.chatCreate).toHaveBeenCalledWith(expect.objectContaining({
                response_format: { type: 'json_object' }
            }));
        });
    });

    describe('chatWithExpert', () => {
        it('respects system prompt based on persona: tough_love', async () => {
            const mocks = getMocks();
            const messages: Message[] = [{ role: 'user', content: 'Help me' }];

            mocks.chatCreate.mockResolvedValueOnce({
                [Symbol.asyncIterator]: async function* () {
                    yield { choices: [{ delta: { content: 'response' } }] };
                }
            });

            await chatWithExpert(messages, 'tough_love');

            expect(mocks.chatCreate).toHaveBeenCalledWith(expect.objectContaining({
                messages: expect.arrayContaining([
                    { role: 'system', content: SYSTEM_PROMPTS.TOUGH_LOVE }
                ])
            }));
        });

        it('respects system prompt based on persona: scientific', async () => {
            const mocks = getMocks();
            const messages: Message[] = [{ role: 'user', content: 'Help me' }];

            mocks.chatCreate.mockResolvedValueOnce({
                [Symbol.asyncIterator]: async function* () {
                    yield { choices: [{ delta: { content: 'response' } }] };
                }
            });

            await chatWithExpert(messages, 'scientific');

            expect(mocks.chatCreate).toHaveBeenCalledWith(expect.objectContaining({
                messages: expect.arrayContaining([
                    { role: 'system', content: SYSTEM_PROMPTS.SCIENTIFIC }
                ])
            }));
        });
    });

    describe('transcribeAudio', () => {
        it('calls openai transcription with file', async () => {
            const mocks = getMocks();
            const mockBlob = new Blob(['audio data'], { type: 'audio/wav' });
            mocks.audioCreate.mockResolvedValueOnce({ text: 'Hello world' });

            const text = await transcribeAudio(mockBlob);

            expect(text).toBe('Hello world');
            expect(mocks.audioCreate).toHaveBeenCalledTimes(1);
        });
    });
});
