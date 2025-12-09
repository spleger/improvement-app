import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Seed Goal Domains
    const domains = await Promise.all([
        prisma.goalDomain.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                name: 'Languages',
                icon: 'languages',
                color: '#6366f1',
                description: 'Learning new languages and improving fluency',
                examples: JSON.stringify(['Learn German', 'Improve Spanish fluency', 'Master Japanese basics'])
            }
        }),
        prisma.goalDomain.upsert({
            where: { id: 2 },
            update: {},
            create: {
                id: 2,
                name: 'Mobility',
                icon: 'stretch',
                color: '#22c55e',
                description: 'Physical flexibility and movement improvement',
                examples: JSON.stringify(['Touch toes', 'Full splits', 'Improve hip mobility'])
            }
        }),
        prisma.goalDomain.upsert({
            where: { id: 3 },
            update: {},
            create: {
                id: 3,
                name: 'Emotional Growth',
                icon: 'heart',
                color: '#ec4899',
                description: 'Emotional intelligence and regulation',
                examples: JSON.stringify(['Reduce anxiety', 'Increase patience', 'Better stress management'])
            }
        }),
        prisma.goalDomain.upsert({
            where: { id: 4 },
            update: {},
            create: {
                id: 4,
                name: 'Relationships',
                icon: 'users',
                color: '#f59e0b',
                description: 'Interpersonal connections and communication',
                examples: JSON.stringify(['Deeper friendships', 'Better communication', 'Family bonding'])
            }
        }),
        prisma.goalDomain.upsert({
            where: { id: 5 },
            update: {},
            create: {
                id: 5,
                name: 'Physical Health',
                icon: 'dumbbell',
                color: '#ef4444',
                description: 'Body composition and fitness',
                examples: JSON.stringify(['Build muscle', 'Improve endurance', 'Lose weight'])
            }
        }),
        prisma.goalDomain.upsert({
            where: { id: 6 },
            update: {},
            create: {
                id: 6,
                name: 'Tolerance',
                icon: 'shield',
                color: '#8b5cf6',
                description: 'Building resilience to discomfort',
                examples: JSON.stringify(['Cold tolerance', 'Public speaking comfort', 'Pain tolerance'])
            }
        }),
        prisma.goalDomain.upsert({
            where: { id: 7 },
            update: {},
            create: {
                id: 7,
                name: 'Skills',
                icon: 'wrench',
                color: '#06b6d4',
                description: 'Practical abilities and talents',
                examples: JSON.stringify(['Learn piano', 'Master cooking', 'Photography skills'])
            }
        }),
        prisma.goalDomain.upsert({
            where: { id: 8 },
            update: {},
            create: {
                id: 8,
                name: 'Habits',
                icon: 'repeat',
                color: '#84cc16',
                description: 'Routine behaviors and lifestyle changes',
                examples: JSON.stringify(['Morning routine', 'Quit smoking', 'Daily meditation'])
            }
        })
    ]);

    console.log(`✅ Created ${domains.length} goal domains`);

    // Seed Challenge Templates
    const challengeTemplates = await Promise.all([
        // Languages challenges
        prisma.challengeTemplate.create({
            data: {
                domainId: 1,
                title: 'Immersion Hour',
                description: 'Change all your device languages to your target language for one hour and navigate normally',
                instructions: 'Go to settings on your phone and computer. Change the language. Use your devices normally for the next hour.',
                durationMinutes: 60,
                difficulty: 3,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Immersive language exposure increases retention by 40%']),
                tags: JSON.stringify(['immersion', 'passive', 'beginner-friendly']),
                successCriteria: 'Complete 1 hour with devices in target language'
            }
        }),
        prisma.challengeTemplate.create({
            data: {
                domainId: 1,
                title: 'Think in Your Target Language',
                description: 'For 20 minutes, narrate your thoughts internally in your target language only',
                instructions: 'Set a timer for 20 minutes. Think about your day, plans, or surroundings entirely in the target language.',
                durationMinutes: 20,
                difficulty: 5,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Internal monologue practice builds automatic retrieval']),
                tags: JSON.stringify(['thinking', 'internal', 'intermediate']),
                successCriteria: 'Maintain internal dialogue for 20 minutes'
            }
        }),
        prisma.challengeTemplate.create({
            data: {
                domainId: 1,
                title: 'Stranger Conversation',
                description: 'Find a native speaker online or in person and have a 5-minute conversation',
                instructions: 'Use language exchange apps, local meetups, or online platforms to find a conversation partner.',
                durationMinutes: 30,
                difficulty: 7,
                isRealityShift: true,
                scientificReferences: JSON.stringify(['Active production with feedback accelerates fluency by 60%']),
                tags: JSON.stringify(['speaking', 'social', 'advanced']),
                successCriteria: 'Complete a 5+ minute conversation with a native speaker'
            }
        }),

        // Mobility challenges
        prisma.challengeTemplate.create({
            data: {
                domainId: 2,
                title: 'Morning Mobility Flow',
                description: 'Complete a 15-minute mobility routine as the first thing after waking up',
                instructions: 'Include: hip circles, shoulder rotations, cat-cow stretches, and gentle twists. Move slowly and breathe deeply.',
                durationMinutes: 15,
                difficulty: 3,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Morning mobility increases flexibility gains by 25%']),
                tags: JSON.stringify(['morning', 'routine', 'beginner']),
                successCriteria: 'Complete full 15-minute mobility routine before any other activity'
            }
        }),
        prisma.challengeTemplate.create({
            data: {
                domainId: 2,
                title: 'Deep Squat Hold',
                description: 'Accumulate 5 minutes in a deep squat position throughout the day',
                instructions: 'Hold a deep squat (heels down if possible) for as long as comfortable. Track total time.',
                durationMinutes: 5,
                difficulty: 5,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Deep squat practice restores natural hip mobility']),
                tags: JSON.stringify(['squat', 'flexibility', 'intermediate']),
                successCriteria: 'Total of 5 minutes accumulated in deep squat'
            }
        }),

        // Emotional Growth challenges
        prisma.challengeTemplate.create({
            data: {
                domainId: 3,
                title: 'Emotion Labeling',
                description: 'Set 5 random alarms. When they go off, identify and write down your exact emotion',
                instructions: 'Use specific emotion words (not just "good" or "bad"). Examples: anxious, content, frustrated, curious.',
                durationMinutes: 30,
                difficulty: 3,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Emotion labeling reduces amygdala reactivity by 50%']),
                tags: JSON.stringify(['awareness', 'mindfulness', 'beginner']),
                successCriteria: 'Complete all 5 emotion check-ins with specific labels'
            }
        }),
        prisma.challengeTemplate.create({
            data: {
                domainId: 3,
                title: 'Uncomfortable Conversation',
                description: 'Have a conversation you\'ve been avoiding - address something that\'s been bothering you',
                instructions: 'Choose something small but real. Use "I feel" statements. Focus on understanding, not winning.',
                durationMinutes: 30,
                difficulty: 8,
                isRealityShift: true,
                scientificReferences: JSON.stringify(['Approaching difficult conversations builds emotional resilience']),
                tags: JSON.stringify(['confrontation', 'growth', 'advanced']),
                successCriteria: 'Have the conversation you\'ve been avoiding'
            }
        }),

        // Tolerance challenges
        prisma.challengeTemplate.create({
            data: {
                domainId: 6,
                title: 'Cold Shower Finish',
                description: 'End your shower with 30 seconds of cold water',
                instructions: 'Take your normal shower, then switch to cold for the last 30 seconds. Breathe slowly and stay calm.',
                durationMinutes: 1,
                difficulty: 4,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Cold exposure increases dopamine by 250% and builds mental resilience']),
                tags: JSON.stringify(['cold', 'discomfort', 'beginner']),
                successCriteria: 'Complete 30 seconds of cold water at end of shower'
            }
        }),
        prisma.challengeTemplate.create({
            data: {
                domainId: 6,
                title: '24-Hour Digital Silence',
                description: 'Complete disconnection from all screens and digital devices for 24 hours',
                instructions: 'Put all devices away or in airplane mode. Read, walk, cook, talk to people. No exceptions.',
                durationMinutes: 1440,
                difficulty: 9,
                isRealityShift: true,
                scientificReferences: JSON.stringify(['Digital detox increases presence, creativity, and reduces anxiety']),
                tags: JSON.stringify(['digital-detox', 'extreme', 'advanced']),
                successCriteria: 'Zero screen time for 24 hours'
            }
        }),

        // Relationships challenges
        prisma.challengeTemplate.create({
            data: {
                domainId: 4,
                title: 'Active Listening',
                description: 'Ask a friend or family member about their day and listen without interrupting or offering advice',
                instructions: 'Ask "How was your day?" or specific questions. Listen only. Summarize what they said at the end to show understanding.',
                durationMinutes: 15,
                difficulty: 4,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Active listening strengthens relationship trust and satisfaction']),
                tags: JSON.stringify(['listening', 'communication', 'beginner']),
                successCriteria: 'Listen for 5+ minutes without interrupting'
            }
        }),
        prisma.challengeTemplate.create({
            data: {
                domainId: 4,
                title: 'Gratitude Message',
                description: 'Send a detailed text or voice note to someone explaining why you appreciate them',
                instructions: 'Pick someone you haven\'t thanked recently. Be specific about what they did and how it helped you.',
                durationMinutes: 5,
                difficulty: 3,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Expressing gratitude increases relationship satisfaction for both parties']),
                tags: JSON.stringify(['gratitude', 'connection', 'beginner']),
                successCriteria: 'Send one specific gratitude message'
            }
        }),

        // Physical Health challenges
        prisma.challengeTemplate.create({
            data: {
                domainId: 5,
                title: 'Water First',
                description: 'Drink 500ml of water immediately upon waking up',
                instructions: 'Prepare a bottle/glass the night before. Drink it before coffee or checking your phone.',
                durationMinutes: 2,
                difficulty: 1,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Morning hydration improves cognitive performance and energy']),
                tags: JSON.stringify(['hydration', 'morning', 'beginner']),
                successCriteria: 'Finish 500ml water within 10 mins of waking'
            }
        }),
        prisma.challengeTemplate.create({
            data: {
                domainId: 5,
                title: 'Zone 2 Cardio',
                description: 'Go for a 30-minute brisk walk or light jog where you can speak in full sentences',
                instructions: 'Maintain a pace where your heart rate is elevated but you are not breathless.',
                durationMinutes: 30,
                difficulty: 4,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Zone 2 cardio improves mitochondrial efficiency and metabolic health']),
                tags: JSON.stringify(['cardio', 'fitness', 'beginner']),
                successCriteria: 'Complete 30 minutes of continuous movement'
            }
        }),

        // Skills challenges
        prisma.challengeTemplate.create({
            data: {
                domainId: 7,
                title: '15-Minute Focused Practice',
                description: 'Practice a specific sub-skill of your target talent without distraction',
                instructions: 'Pick one tiny aspect (e.g., one chord, one knife cut, one coding concept). Set a timer. No phone.',
                durationMinutes: 15,
                difficulty: 4,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Deliberate practice is more effective than passive repetition']),
                tags: JSON.stringify(['practice', 'focus', 'intermediate']),
                successCriteria: '15 minutes of uninterrupted practice'
            }
        }),
        prisma.challengeTemplate.create({
            data: {
                domainId: 7,
                title: 'Teach It Back',
                description: 'Explain a concept you are learning to someone else (or an imaginary audience) simply',
                instructions: 'Use the Feynman technique. Explain it as if to a 5-year-old. Identify gaps in your own understanding.',
                durationMinutes: 10,
                difficulty: 6,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Teaching information increases retention (Protégé Effect)']),
                tags: JSON.stringify(['teaching', 'learning', 'intermediate']),
                successCriteria: 'Successfully explain one concept simply'
            }
        }),

        prisma.challengeTemplate.create({
            data: {
                domainId: 8,
                title: 'Habit Stacking',
                description: 'Attach your new habit to an existing routine you never skip',
                instructions: 'Identify a habit you do daily (brushing teeth, coffee). Add your new habit immediately before or after.',
                durationMinutes: 10,
                difficulty: 2,
                isRealityShift: false,
                scientificReferences: JSON.stringify(['Habit stacking increases habit formation success by 73%']),
                tags: JSON.stringify(['habit', 'routine', 'beginner']),
                successCriteria: 'Successfully stack new habit with existing routine'
            }
        }),
        prisma.challengeTemplate.create({
            data: {
                domainId: 8,
                title: 'Public Commitment',
                description: 'Post your goal publicly on social media with a commitment to daily updates',
                instructions: 'Write a sincere post about your goal. Commit to posting updates. Ask friends to hold you accountable.',
                durationMinutes: 15,
                difficulty: 6,
                isRealityShift: true,
                scientificReferences: JSON.stringify(['Public commitment increases follow-through by 65%']),
                tags: JSON.stringify(['accountability', 'social', 'intermediate']),
                successCriteria: 'Post made publicly with commitment to updates'
            }
        })
    ]);

    console.log(`✅ Created ${challengeTemplates.length} challenge templates`);

    console.log('🎉 Seeding complete!');
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
