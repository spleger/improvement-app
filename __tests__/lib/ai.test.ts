import { UserPrefs, Goal, Message, GeneratedChallenge } from '../../lib/types';

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
import { generateChallenge, generateMultipleChallenges, chatWithExpert, transcribeAudio, SYSTEM_PROMPTS } from '../../lib/ai';

// Get references to the mocks
const getMocks = () => (OpenAI as any).__mocks as { chatCreate: jest.Mock; audioCreate: jest.Mock };

describe('AI Service Layer', () => {
    beforeEach(() => {
        const mocks = getMocks();
        mocks.chatCreate.mockReset();
        mocks.audioCreate.mockReset();
    });

    describe('generateChallenge', () => {
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

        it('returns structured JSON matching GeneratedChallenge schema with all fields', async () => {
            const mocks = getMocks();

            const mockResponse = {
                title: 'Run 5km',
                description: 'Run 5km in under 30 mins to build base endurance',
                instructions: '1. Warm up for 5 minutes\n2. Run at a comfortable pace\n3. Cool down for 5 minutes',
                successCriteria: 'Complete the full 5km distance in under 30 minutes',
                tips: ['Start slow and build up', 'Stay hydrated', 'Focus on your breathing'],
                difficulty: 7,
                isRealityShift: true,
                challengeType: 'physical'
            };

            mocks.chatCreate.mockResolvedValueOnce({
                choices: [{ message: { content: JSON.stringify(mockResponse) } }]
            });

            const result = await generateChallenge(mockPrefs, mockGoal);

            // Verify all required GeneratedChallenge fields are present
            expect(result).toHaveProperty('title', 'Run 5km');
            expect(result).toHaveProperty('description', 'Run 5km in under 30 mins to build base endurance');
            expect(result).toHaveProperty('instructions', '1. Warm up for 5 minutes\n2. Run at a comfortable pace\n3. Cool down for 5 minutes');
            expect(result).toHaveProperty('successCriteria', 'Complete the full 5km distance in under 30 minutes');
            expect(result).toHaveProperty('difficulty', 7);
            expect(result).toHaveProperty('isRealityShift', true);
            expect(result).toHaveProperty('personalizationNotes', 'physical');

            // Tips should be JSON-stringified array
            expect(result).toHaveProperty('tips');
            expect(typeof result.tips).toBe('string');
            const parsedTips = JSON.parse(result.tips as string);
            expect(parsedTips).toEqual(['Start slow and build up', 'Stay hydrated', 'Focus on your breathing']);

            expect(mocks.chatCreate).toHaveBeenCalledWith(expect.objectContaining({
                response_format: { type: 'json_object' }
            }));
        });

        it('handles missing optional fields gracefully', async () => {
            const mocks = getMocks();

            const minimalResponse = {
                title: 'Run 5km',
                description: 'Run 5km',
                difficulty: 7,
                isRealityShift: false
            };

            mocks.chatCreate.mockResolvedValueOnce({
                choices: [{ message: { content: JSON.stringify(minimalResponse) } }]
            });

            const result = await generateChallenge(mockPrefs, mockGoal);

            expect(result.title).toBe('Run 5km');
            expect(result.description).toBe('Run 5km');
            expect(result.instructions).toBeNull();
            expect(result.successCriteria).toBeNull();
            expect(result.tips).toBeNull();
            expect(result.personalizationNotes).toBeNull();
        });

        it('uses user preferred difficulty when AI does not provide one', async () => {
            const mocks = getMocks();

            const responseWithoutDifficulty = {
                title: 'Run 5km',
                description: 'Run 5km',
                isRealityShift: false
            };

            mocks.chatCreate.mockResolvedValueOnce({
                choices: [{ message: { content: JSON.stringify(responseWithoutDifficulty) } }]
            });

            const result = await generateChallenge(mockPrefs, mockGoal);

            expect(result.difficulty).toBe(mockPrefs.preferredDifficulty);
        });

        it('throws error when AI returns no content', async () => {
            const mocks = getMocks();

            mocks.chatCreate.mockResolvedValueOnce({
                choices: [{ message: { content: null } }]
            });

            await expect(generateChallenge(mockPrefs, mockGoal)).rejects.toThrow('No content received from AI');
        });
    });

    describe('generateMultipleChallenges', () => {
        const mockGoal: Goal = {
            id: '1',
            title: 'Learn Spanish',
            userId: 'user1',
            description: 'Become conversational in Spanish',
            currentState: 'Beginner',
            desiredState: 'Conversational level',
            difficultyLevel: 5,
            realityShiftEnabled: false,
            status: 'active',
            startedAt: new Date(),
            targetDate: null,
            domainId: null,
            completedAt: null
        };

        const mockPrefs: UserPrefs = {
            preferredDifficulty: 5,
            focusAreas: ['language'],
            avoidAreas: [],
            realityShiftEnabled: false,
            aiPersonality: 'empathetic'
        };

        it('returns array of GeneratedChallenge objects with diverse types', async () => {
            const mocks = getMocks();

            const mockResponse = {
                challenges: [
                    {
                        title: 'Learn 10 Spanish food words',
                        description: 'Expand your vocabulary with food-related terms',
                        instructions: '1. Use Duolingo\n2. Practice pronunciation\n3. Write a restaurant order',
                        successCriteria: 'Successfully use all 10 words in a mock order',
                        tips: ['Focus on pronunciation', 'Use flashcards', 'Practice with native audio'],
                        difficulty: 4,
                        isRealityShift: false,
                        challengeType: 'skill'
                    },
                    {
                        title: 'Journal about language goals',
                        description: 'Reflect on why you want to learn Spanish',
                        instructions: '1. Set timer for 15 min\n2. Write about your motivation\n3. List 3 goals',
                        successCriteria: 'Completed journal entry with 3 clear goals',
                        tips: ['Be honest with yourself', 'Think about travel plans', 'Consider career benefits'],
                        difficulty: 3,
                        isRealityShift: false,
                        challengeType: 'reflection'
                    },
                    {
                        title: 'Find 3 Spanish learning resources',
                        description: 'Research different ways to learn Spanish',
                        instructions: '1. Search for podcasts\n2. Find YouTube channels\n3. Look for apps',
                        successCriteria: 'List of 3 resources with brief notes on each',
                        tips: ['Check reviews', 'Try free versions first', 'Look for beginner content'],
                        difficulty: 3,
                        isRealityShift: false,
                        challengeType: 'research'
                    }
                ]
            };

            mocks.chatCreate.mockResolvedValueOnce({
                choices: [{ message: { content: JSON.stringify(mockResponse) } }]
            });

            const result = await generateMultipleChallenges(3, mockPrefs, mockGoal);

            // Verify it returns an array
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(3);

            // Verify each challenge has the complete structure
            result.forEach((challenge) => {
                expect(challenge).toHaveProperty('title');
                expect(challenge).toHaveProperty('description');
                expect(challenge).toHaveProperty('instructions');
                expect(challenge).toHaveProperty('successCriteria');
                expect(challenge).toHaveProperty('tips');
                expect(challenge).toHaveProperty('difficulty');
                expect(challenge).toHaveProperty('isRealityShift');
                expect(challenge).toHaveProperty('personalizationNotes'); // challengeType stored here
            });

            // Verify tips are JSON-stringified arrays
            result.forEach((challenge) => {
                expect(typeof challenge.tips).toBe('string');
                const parsedTips = JSON.parse(challenge.tips as string);
                expect(Array.isArray(parsedTips)).toBe(true);
            });

            // Verify diverse challenge types (stored in personalizationNotes)
            const types = result.map(c => c.personalizationNotes);
            expect(types).toContain('skill');
            expect(types).toContain('reflection');
            expect(types).toContain('research');
        });

        it('clamps count between 1 and 5', async () => {
            const mocks = getMocks();

            const mockSingleChallenge = {
                challenges: [{
                    title: 'Challenge 1',
                    description: 'Description',
                    instructions: 'Instructions',
                    successCriteria: 'Criteria',
                    tips: ['Tip 1'],
                    difficulty: 5,
                    isRealityShift: false,
                    challengeType: 'physical'
                }]
            };

            mocks.chatCreate.mockResolvedValueOnce({
                choices: [{ message: { content: JSON.stringify(mockSingleChallenge) } }]
            });

            // Even with count 0, should request at least 1
            await generateMultipleChallenges(0, mockPrefs, mockGoal);

            expect(mocks.chatCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    messages: expect.arrayContaining([
                        expect.objectContaining({
                            content: expect.stringContaining('1 DISTINCT')
                        })
                    ])
                })
            );
        });

        it('throws error when AI returns no content', async () => {
            const mocks = getMocks();

            mocks.chatCreate.mockResolvedValueOnce({
                choices: [{ message: { content: null } }]
            });

            await expect(generateMultipleChallenges(3, mockPrefs, mockGoal)).rejects.toThrow('No content received from AI');
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
