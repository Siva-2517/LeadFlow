# LeadFlow — AI-Smart CRM

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.4+-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**LeadFlow** is a modern, single-screen Lead Management CRM built for sales teams in B2B SaaS and fintech organizations. It centralizes lead pipelines, discussion histories, and follow-up schedules in a single, responsive interface inspired by Linear and Attio.

---

## Table of Contents

1. [Key Features](#key-features)
2. [UI and Design System](#ui-and-design-system)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [REST API Reference](#rest-api-reference)
6. [Prerequisites](#prerequisites)
7. [Environment Variables](#environment-variables)
8. [Step-by-Step Setup](#step-by-step-setup)
9. [Database Migrations and Seeding](#database-migrations-and-seeding)
10. [Running the Application](#running-the-application)
11. [Running Tests](#running-tests)
12. [Screenshots](#screenshots)
13. [Cloud Deployment Guidance](#cloud-deployment-guidance)

---

## Key Features

- **Lead Lifecycle Management**: Full tracking for all 6 statuses (`New`, `Contacted`, `Qualified`, `Proposal Sent`, `Won`, `Lost`).
- **Timezone-Aware Follow-ups (`Asia/Kolkata`)**: Follow-up schedules and calendar midnight boundaries are calculated against local timezone boundaries while stored consistently in UTC.
- **Priority Follow-up Ordering**: Leads scheduled for today are pinned at the top ordered by scheduled time ascending; remaining leads are sorted by most recently updated.
- **Overdue Highlighting**: Overdue follow-ups are visually surfaced with high-contrast red alert indicators and border accents.
- **Lead Timeline Dialog**: Slide-in modal without page reloads. Displays chronological conversation histories (newest first) and includes an inline discussion logger.
- **Atomic Operations**: Adding a discussion with a follow-up date atomically creates the discussion and updates the lead's follow-up schedule in a single database transaction. Existing follow-ups are preserved unless explicitly modified or cleared.
- **Interactive Search and Status Filtering**: Real-time name search and status pill filters operate together with instant filter reset.
- **Dashboard Metrics Summary**: Overview cards displaying Total Leads, Follow-ups Today, Overdue Follow-ups, and Won Leads.

---

## UI and Design System

The visual style is tailored for modern B2B SaaS and fintech applications:
- Clean light theme with soft neutral background (`#F8FAFC`).
- High-contrast typography using Inter.
- Curated, accessible status badge tokens with tailored background and border styling.
- Restrained primary blue accents (`#2563EB`).
- Fully responsive layout for desktop, tablet, and mobile viewports.

---

## Architecture Overview

```text
                      +---------------------------------------+
                      |       Next.js 16 (App Router)        |
                      |   TypeScript + Tailwind + React Query |
                      +-------------------+-------------------+
                                          |
                                    REST APIs (/api/v1)
                                          |
                                          v
                      +---------------------------------------+
                      |         FastAPI REST Backend          |
                      |     Pydantic v2 + SQLAlchemy 2.x      |
                      +-------------------+-------------------+
                                          |
                                    SQLAlchemy Session
                                          |
                                          v
                      +---------------------------------------+
                      |     PostgreSQL / Cloud Database       |
                      |      (Neon, Supabase, or SQLite)      |
                      +---------------------------------------+
```

---

## Database Schema

### `leads` Table

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | PRIMARY KEY | Unique lead identifier |
| `name` | `VARCHAR(255)` | NOT NULL, INDEXED | Full name of the lead |
| `company` | `VARCHAR(255)` | NULLABLE | Company or organization name |
| `phone` | `VARCHAR(50)` | NULLABLE | Contact phone number |
| `status` | `VARCHAR(50)` | NOT NULL, DEFAULT `'New'` | Lead status |
| `next_follow_up_at` | `TIMESTAMPTZ` | NULLABLE, INDEXED | UTC timestamp for next scheduled follow-up |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Record creation UTC timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Last record update UTC timestamp |

### `discussions` Table

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | PRIMARY KEY | Unique discussion identifier |
| `lead_id` | `UUID` | FOREIGN KEY (`leads.id`) ON DELETE CASCADE | Associated lead reference |
| `note` | `TEXT` | NOT NULL | Discussion content |
| `follow_up_at` | `TIMESTAMPTZ` | NULLABLE | Follow-up scheduled during this discussion |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, INDEXED | Discussion creation UTC timestamp |

---

## REST API Reference

All endpoints are served under the `/api/v1` prefix:

### Leads and Metrics
- `GET /api/v1/health`: Health status and database connectivity check.
- `GET /api/v1/leads/stats/summary`: Summary metrics (Total Leads, Follow-ups Today, Overdue, Won Leads).
- `GET /api/v1/leads`: List leads with optional `query` (name search) and `status` filter.
- `POST /api/v1/leads`: Create a new lead (requires non-empty `name`, defaults status to `New`).
- `GET /api/v1/leads/{lead_id}`: Fetch detailed lead profile including timeline history.
- `PATCH /api/v1/leads/{lead_id}`: Update lead details, status, or explicitly clear a follow-up.

### Discussions
- `GET /api/v1/leads/{lead_id}/discussions`: Get all discussions for a lead ordered newest first.
- `POST /api/v1/leads/{lead_id}/discussions`: Add a new discussion note and optionally schedule or clear a follow-up (atomic transaction).

FastAPI interactive Swagger documentation is available at `http://localhost:8000/docs`.

---

## Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- **Database**: PostgreSQL (local or cloud provider such as Neon, Supabase, Render, Aiven) or persistent SQLite fallback.

---

## Environment Variables

Dedicated environment files are maintained separately for backend and frontend:

### Backend Configuration (`backend/.env`)

```env
# Database Connection URL
# For PostgreSQL / Cloud Postgres (Neon / Supabase / Render / Aiven):
# DATABASE_URL=postgresql+psycopg://username:password@ep-host.region.aws.neon.tech/leadflow?sslmode=require
# For local persistent database:
DATABASE_URL=sqlite:///./leadflow.db

# Application Timezone (Calculates today and overdue follow-up boundaries)
APP_TIMEZONE=Asia/Kolkata

# Backend Host and Port
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000

# Allowed CORS Origins (Comma-separated)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Frontend Configuration (`frontend/.env.local`)

```env
# Fast API Backend Base URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Templates with safe default placeholders are provided in `backend/.env.example` and `frontend/.env.example`.

---

## Step-by-Step Setup

### Step 1: Clone Repository and Set Up Python Environment

```bash
git clone <repository-url>
cd leadflow

# Create Python virtual environment
python -m venv backend/.venv

# Activate virtual environment
# Windows (PowerShell):
backend\.venv\Scripts\Activate.ps1
# Windows (Command Prompt):
backend\venv\Scripts\activate.bat
# macOS / Linux:
source backend/.venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## Database Migrations and Seeding

> [!NOTE]
> Database migrations must be run before starting the application for the first time.

### Run Alembic Migrations

Execute from the repository root:

```bash
# Windows:
backend\.venv\Scripts\alembic.exe -c backend\alembic.ini upgrade head

# macOS / Linux:
backend/.venv/bin/alembic -c backend/alembic.ini upgrade head
```

### Run Idempotent Seed Script

Populates 6 realistic sample leads with discussion histories, follow-ups scheduled for today, and overdue follow-ups:

```bash
# Windows:
backend\.venv\Scripts\python.exe backend\scripts\seed.py

# macOS / Linux:
backend/.venv/bin/python backend/scripts/seed.py
```

The seed script is idempotent; running it multiple times updates existing records without creating duplicates.

---

## Running the Application

### 1. Start FastAPI Backend

```bash
cd backend

# Windows:
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# macOS / Linux:
./.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

- Backend API: `http://localhost:8000`
- Interactive Swagger Documentation: `http://localhost:8000/docs`

### 2. Start Next.js Frontend

Open a separate terminal:

```bash
cd frontend
npm run dev -- -p 3000
```

- Web Application: `http://localhost:3000`

---

## Running Tests

Run the complete automated backend test suite covering CRUD operations, name validation, default statuses, discussion ordering, atomic transactions, follow-up calculations, and timezone boundaries:

```bash
# Windows:
backend\.venv\Scripts\pytest.exe -v

# macOS / Linux:
backend/.venv/bin/pytest -v
```

All 13 automated tests execute in an isolated test environment and pass in under 1 second.

---

## Screenshots

### 1. Lead Management Dashboard
![LeadFlow Dashboard](docs/screenshots/dashboard.png)

### 2. Add New Lead Modal Dialog
![Add Lead Modal](docs/screenshots/add_lead_modal.png)

### 3. Lead Timeline and Discussion Log
![Lead Timeline](docs/screenshots/lead_timeline_modal.png)

---

## Cloud Deployment Guidance

### Backend Deployment (Render / Railway / Google Cloud Run)

1. Set the runtime environment variables:
   - `DATABASE_URL`: Hosted PostgreSQL connection string with `?sslmode=require`
   - `APP_TIMEZONE`: `Asia/Kolkata`
   - `CORS_ORIGINS`: Production frontend domain (e.g., `https://your-frontend.vercel.app`)
2. Run database migrations in your build/release phase:
   ```bash
   alembic -c backend/alembic.ini upgrade head
   ```
3. Set the start command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Frontend Deployment (Vercel)

1. Connect the repository root pointing to the `frontend/` directory.
2. Configure the environment variable:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend API URL (e.g., `https://your-backend.onrender.com/api/v1`)
3. Deploy directly with standard Next.js build settings.

### Cloud Database (Neon / Supabase / Aiven)

Supply the PostgreSQL connection string in `DATABASE_URL`:

```env
DATABASE_URL=postgresql+psycopg://user:password@host/dbname?sslmode=require
```

SQLAlchemy automatically handles connection pooling with pre-ping validation, and Alembic manages schema migrations.
