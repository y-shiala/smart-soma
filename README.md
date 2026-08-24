# Smart Soma

Smart Soma is an AI-powered homework helper for Kenyan students following the Competency-Based Curriculum (CBC). Students can ask questions by typing, voice, or camera scan, receive step-by-step explanations, practice with generated questions, and track their learning progress.

## Features

- English and Kiswahili interface
- Email/password registration and login
- Grade selection for lower primary, upper primary, junior high, and senior high
- Senior-high pathway selection: STEM, social sciences, or arts and sports
- Homework questions through text, voice, and camera input
- AI-generated explanations and teaching checks using Gemini
- AI-generated practice questions
- Progress tracking, accuracy, streaks, and learning history
- User preferences saved to PostgreSQL
- Responsive desktop and mobile navigation

## Project Structure

```text
smart-soma/
├── client/                  # React, TypeScript, Vite frontend
│   ├── src/components/      # Shared UI and learning components
│   ├── src/pages/           # Home, auth, learning, progress, and settings pages
│   ├── src/hooks/           # Auth, preferences, progress, and learning state
│   └── src/lib/             # API client and shared utilities
├── server/                  # NestJS backend
│   ├── src/auth/            # Registration, login, JWT, and refresh tokens
│   ├── src/ai/              # AI provider abstraction and Gemini provider
│   ├── src/learning/        # Explanations, practice, and teaching checks
│   ├── src/preferences/     # User learning preferences
│   ├── src/progress/        # Progress statistics and history
│   └── prisma/              # PostgreSQL schema and migrations
└── README.md
```

## Prerequisites

- Node.js 20.19 or newer
- pnpm
- PostgreSQL
- A Google Gemini API key

## Installation

Clone the repository and install dependencies in both packages:

```bash
cd client
pnpm install

cd ../server
pnpm install
```

## Environment Variables

### Frontend

Create `client/.env` from `client/.env.example`:

```env
VITE_API_URL=http://localhost:3000
```

### Backend

Create `server/.env` from `server/.env.example` and set values for your environment:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/smart_soma?schema=public"
JWT_ACCESS_SECRET="replace-with-a-long-random-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
AI_PROVIDER="gemini"
AI_MODEL="gemini-3.7-flash"
GEMINI_API_KEY="your-gemini-api-key"
```

Do not commit `.env` files or real secrets.

## Database Setup

Make sure PostgreSQL is running and `DATABASE_URL` points to the target database. From the server directory, generate the Prisma client and apply migrations:

```bash
cd server
pnpm exec prisma generate
pnpm exec prisma migrate deploy
```

For local development when creating or changing a migration:

```bash
pnpm exec prisma migrate dev --name describe-your-change
```

The Prisma schema is in `server/prisma/schema.prisma`. The generated client is written to `server/generated/prisma`.

## Running Locally

Start the backend first:

```bash
cd server
pnpm run start:dev
```

The API listens on `http://localhost:3000` by default. The server accepts browser requests from `http://localhost:5173` and `http://localhost:5174`.

In a second terminal, start the frontend:

```bash
cd client
pnpm run dev
```

Open `http://localhost:5173` in a browser.

## Frontend Scripts

Run these commands from `client/`:

| Command | Purpose |
| --- | --- |
| `pnpm run dev` | Start the Vite development server |
| `pnpm run build` | Create a production build |
| `pnpm run build:dev` | Create a development-mode build |
| `pnpm run preview` | Preview the production build |
| `pnpm run lint` | Run ESLint |

## Backend Scripts

Run these commands from `server/`:

| Command | Purpose |
| --- | --- |
| `pnpm run start` | Start the NestJS server |
| `pnpm run start:dev` | Start the server in watch mode |
| `pnpm run start:prod` | Run the compiled server |
| `pnpm run build` | Compile the backend |
| `pnpm run lint` | Run ESLint with autofix |
| `pnpm run test` | Run unit tests |
| `pnpm run test:e2e` | Run end-to-end tests |
| `pnpm run test:cov` | Run tests with coverage |

## Application Routes

| Route | Description | Access |
| --- | --- | --- |
| `/` | Product home page | Public |
| `/auth` | Sign in and registration | Public |
| `/learn` | Learning workspace | Authenticated |
| `/progress` | Progress dashboard | Authenticated |
| `/settings` | Grade, subject, and pathway preferences | Authenticated |

## API Endpoints

The API base URL is configured through `VITE_API_URL`. Authenticated endpoints require a bearer access token.

### Health

- `GET /` - Basic server response

### Authentication

- `POST /auth/register` - Create an account and issue tokens
- `POST /auth/login` - Authenticate an existing account
- `POST /auth/refresh` - Rotate a refresh token
- `POST /auth/logout` - Revoke a refresh token
- `GET /auth/me` - Return the authenticated user

### Learning

- `POST /learning/explanation` - Generate a step-by-step explanation
- `POST /learning/practice-question` - Generate a practice question
- `POST /learning/teaching-check` - Evaluate a learner's teaching answer
- `POST /learning/attempts` - Submit and store a practice attempt

### Preferences

- `GET /preferences` - Get the authenticated user's preferences
- `PATCH /preferences` - Update grade, subject, or pathway preferences

### Progress

- `GET /progress` - Get progress statistics
- `GET /progress/history` - Get learning and practice history
- `POST /progress` - Save an explained question to progress

## Architecture Notes

- The frontend is a React 18 application written in TypeScript and bundled with Vite.
- UI primitives use Tailwind CSS, Radix UI, and shared components in `client/src/components/ui`.
- The backend is a NestJS application using feature modules for authentication, AI, learning, preferences, and progress.
- PostgreSQL access uses Prisma 7 with the PostgreSQL driver adapter.
- Passwords are hashed with bcrypt.
- Access tokens use JWT; refresh tokens are stored as SHA-256 hashes and rotated on refresh.
- The AI provider is abstracted behind the backend AI service and currently uses Gemini.
- Global request validation is enabled with whitelisting and rejection of unknown fields.

## Testing

Before opening a pull request, run the relevant checks:

```bash
cd client
pnpm run build

cd ../server
pnpm run build
pnpm run test
pnpm run test:e2e
```

Backend tests require a working test database configuration when the tested code accesses Prisma.

## Contributing

1. Create a focused branch for your change.
2. Keep frontend and backend changes scoped to their owning package.
3. Update Prisma migrations when changing the database schema.
4. Add or update tests for behavior changes.
5. Run the relevant build, lint, and test commands before submitting a pull request.

## License

This project is currently marked as private and unlicensed in the package configuration.
