# GainTracker

Full-stack fitness tracker for weight, exercise, and nutrition — with group challenge support.

## Tech Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Recharts + Vite
- **Backend**: Node.js + Express + PostgreSQL
- **Auth**: JWT (30-day tokens)

## Project Structure
```
GainTracker/
├── client/          # React app (port 5173)
│   └── src/
│       ├── pages/   # LoginPage, DashboardPage, LogPage, ProgressPage, GoalPage, ProfilePage, Challenges*
│       ├── components/  # Layout
│       ├── context/ # AuthContext (JWT state)
│       ├── services/ # axios instance
│       └── types/   # Shared TypeScript interfaces
└── server/          # Express API (port 3001)
    └── src/
        ├── routes/  # auth, users, goals, logs, challenges
        ├── middleware/ # JWT authenticate
        └── db/      # PostgreSQL pool + schema.sql
```

## Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/) v14+

## Setup

### 1. Database
```bash
psql -U postgres -c "CREATE DATABASE gaintracker;"
psql -U postgres -d gaintracker -f server/src/db/schema.sql
```

### 2. Server
```bash
cd server
cp ../.env.example .env
# Edit .env with your DB credentials and a JWT secret
npm install
npm run dev
```

### 3. Client
```bash
cd client
npm install
npm run dev
```

App runs at http://localhost:5173 — the Vite dev server proxies `/api` to port 3001.

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Get JWT |
| GET/PUT | /api/users/me | Profile |
| GET | /api/goals/active | Active goal + TDEE suggestions |
| POST | /api/goals | Set new goal |
| GET/POST/DELETE | /api/logs/weight | Weight logs |
| GET/POST/DELETE | /api/logs/exercise | Exercise logs |
| GET/POST/DELETE | /api/logs/nutrition | Nutrition logs |
| GET | /api/logs/summary/:date | Daily summary |
| GET/POST | /api/challenges | List / create challenges |
| POST | /api/challenges/join | Join via invite code |
| GET | /api/challenges/:id | Detail + leaderboard |
| DELETE | /api/challenges/:id/leave | Leave |

## Key Features

### Calorie/Protein Suggestions
Uses **Mifflin-St Jeor** to estimate TDEE, then adjusts by:
- `7700 kcal ≈ 1 kg` body mass (caloric adjustment for weekly weight change)
- Protein: `~1g per lb` of target bodyweight

### Group Challenge Leaderboard
Ranked by **adherence** (% of days logged since challenge start), not absolute numbers — so a 60kg person and a 100kg person compete on equal footing.

### 7-Day Rolling Average
Smooths out daily weight fluctuations on the dashboard and progress chart.
Build trigger
