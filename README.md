# 🎯 Goal Transformation App

A transformative AI companion app that turns abstract aspirations into concrete daily actions, tracking progress through voice journals, surveys, and visual analytics—culminating in measurable life changes within 30 days.

## Features

- **🎯 Goal Setting**: Choose from 8 transformation domains (Languages, Mobility, Habits, etc.)
- **📋 Daily Challenges**: Personalized challenges with adaptive difficulty
- **⚡ Reality Shift Mode**: Extreme challenges for pushing boundaries
- **📊 Progress Tracking**: Visual dashboard with streak tracking and mood charts
- **📝 Daily Check-ins**: Quick surveys to track energy, motivation, and mood
- **🎙️ Voice Diary** (coming soon): Record and transcribe daily reflections
- **💬 AI Expert** (coming soon): Get personalized guidance from domain experts

## Tech Stack

- **Frontend**: Next.js 14 (React)
- **Database**: SQLite with Prisma ORM
- **Styling**: Custom CSS design system
- **AI**: OpenAI GPT-4 (ready to integrate)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd "Improvement App"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   
   Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Dashboard home
│   ├── challenges/        # Challenge views & completion
│   ├── goals/             # Goal creation
│   ├── progress/          # Progress dashboard
│   ├── survey/            # Daily check-in
│   └── api/               # API routes
├── lib/                   # Shared utilities
│   ├── prisma.ts         # Database client
│   └── types.ts          # TypeScript types
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
└── package.json
```

## Database

Using SQLite for local development. The schema includes:

- **Users** - User accounts and preferences
- **Goals** - User transformation goals
- **GoalDomains** - Categories (Languages, Mobility, etc.)
- **Challenges** - Daily challenges
- **ChallengeTemplates** - Curated challenge library
- **DailySurveys** - Mood and energy tracking
- **DiaryEntries** - Voice journal entries

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | Get user's goals |
| POST | `/api/goals` | Create new goal |
| POST | `/api/challenges/generate` | Generate daily challenge |
| POST | `/api/challenges/[id]/complete` | Complete a challenge |
| GET | `/api/surveys` | Get survey history |
| POST | `/api/surveys` | Submit daily survey |

## Design System

The app includes a comprehensive CSS design system with:

- 4 theme variants (Minimal, Playful, Bold, Nature)
- Gradient buttons and cards
- Progress visualizations
- Animated micro-interactions
- Responsive mobile-first design

## Roadmap

- [x] Core challenge system
- [x] Goal creation flow
- [x] Progress dashboard
- [x] Daily surveys
- [ ] Voice diary with transcription
- [ ] AI Expert chat
- [ ] AI-powered onboarding
- [ ] Personalized challenge generation
- [ ] Push notifications

## License

MIT
