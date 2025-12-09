// Initialize SQLite database with schema
const fs = require('fs');
const path = require('path');

// Simple SQLite implementation using Prisma's libquery
async function initDatabase() {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        // Test connection
        await prisma.$connect();
        console.log('Database connection successful!');

        // The database should be created by Prisma generate
        // Let's seed data directly

        // Seed Goal Domains
        const domains = [
            { id: 1, name: 'Languages', icon: 'languages', color: '#6366f1', description: 'Learning new languages', examples: '["Learn German", "Improve Spanish"]' },
            { id: 2, name: 'Mobility', icon: 'stretch', color: '#22c55e', description: 'Physical flexibility', examples: '["Touch toes", "Full splits"]' },
            { id: 3, name: 'Emotional Growth', icon: 'heart', color: '#ec4899', description: 'Emotional intelligence', examples: '["Reduce anxiety", "Increase patience"]' },
            { id: 4, name: 'Relationships', icon: 'users', color: '#f59e0b', description: 'Interpersonal connections', examples: '["Deeper friendships", "Better communication"]' },
            { id: 5, name: 'Physical Health', icon: 'dumbbell', color: '#ef4444', description: 'Body composition and fitness', examples: '["Build muscle", "Improve endurance"]' },
            { id: 6, name: 'Tolerance', icon: 'shield', color: '#8b5cf6', description: 'Building resilience', examples: '["Cold tolerance", "Public speaking"]' },
            { id: 7, name: 'Skills', icon: 'wrench', color: '#06b6d4', description: 'Practical abilities', examples: '["Learn piano", "Master cooking"]' },
            { id: 8, name: 'Habits', icon: 'repeat', color: '#84cc16', description: 'Routine behaviors', examples: '["Morning routine", "Daily meditation"]' }
        ];

        for (const domain of domains) {
            await prisma.goalDomain.upsert({
                where: { id: domain.id },
                update: domain,
                create: domain
            });
        }
        console.log('Goal domains seeded!');

        // Seed Demo User
        await prisma.user.upsert({
            where: { id: 'demo-user-001' },
            update: {},
            create: {
                id: 'demo-user-001',
                email: 'demo@example.com',
                passwordHash: 'demo',
                displayName: 'Demo User',
                themePreference: 'minimal',
                onboardingCompleted: true,
                timezone: 'UTC'
            }
        });
        console.log('Demo user created!');

        // Seed Challenge Templates
        const templates = [
            { id: 'tpl-lang-001', domainId: 1, title: 'Immersion Hour', description: 'Change all device languages to target language for 1 hour', difficulty: 3, isRealityShift: false, scientificReferences: '["Immersive exposure increases retention by 40%"]' },
            { id: 'tpl-lang-002', domainId: 1, title: 'Think in Target Language', description: 'Narrate thoughts internally in target language for 20 minutes', difficulty: 5, isRealityShift: false, scientificReferences: '["Internal monologue builds automatic retrieval"]' },
            { id: 'tpl-mob-001', domainId: 2, title: 'Morning Mobility Flow', description: '15-minute mobility routine first thing after waking', difficulty: 3, isRealityShift: false, scientificReferences: '["Morning mobility increases flexibility by 25%"]' },
            { id: 'tpl-emo-001', domainId: 3, title: 'Emotion Labeling', description: 'Set 5 alarms and label exact emotion when they ring', difficulty: 3, isRealityShift: false, scientificReferences: '["Emotion labeling reduces amygdala reactivity by 50%"]' },
            { id: 'tpl-tol-001', domainId: 6, title: 'Cold Shower Finish', description: 'End shower with 30 seconds of cold water', difficulty: 4, isRealityShift: false, scientificReferences: '["Cold exposure increases dopamine by 250%"]' },
            { id: 'tpl-hab-001', domainId: 8, title: 'Habit Stacking', description: 'Attach new habit to existing routine', difficulty: 2, isRealityShift: false, scientificReferences: '["Habit stacking increases success by 73%"]' }
        ];

        for (const tpl of templates) {
            await prisma.challengeTemplate.upsert({
                where: { id: tpl.id },
                update: tpl,
                create: tpl
            });
        }
        console.log('Challenge templates seeded!');

        console.log('\n✅ Database initialization complete!');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

initDatabase();
