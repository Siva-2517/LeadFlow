# LeadFlow — AI-Smart CRM

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-16.4+-000000.svg?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Ready-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0+-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**LeadFlow** is a modern, high-performance CRM built for sales and account executives in fast-moving B2B SaaS and fintech organizations. It centralizes lead pipelines, conversation histories, and follow-up schedules in a single, intuitive interface inspired by Linear and Attio.

---

## Table of Contents
1. [Key Features](#key-features)
2. [UI & Design System](#ui--design-system)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [REST API Reference](#rest-api-reference)
6. [Prerequisites](#prerequisites)
7. [Environment Variables](#environment-variables)
8. [Step-by-Step Setup](#step-by-step-setup)
9. [Database Migrations & Seeding](#database-migrations--seeding)
10. [Running Tests](#running-tests)
11. [Screenshots](#screenshots)
12. [Cloud & Deployment Guidance](#cloud--deployment-guidance)

---

## Key Features

- **Lead Management & Status Tracking**: Complete lifecycle support for all 6 core statuses (`New`, `Contacted`, `Qualified`, `Proposal Sent`, `Won`, `Lost`).
- **Timezone-Aware Follow-ups (`Asia/Kolkata`)**: Follow-up schedules and midnight boundaries are calculated against local calendar days while stored consistently in UTC.
- **Priority Follow-Up Ordering**: Leads scheduled for today are pinned at the top ordered by scheduled time ascending; remaining leads are sorted by most recently updated.
- **Real-Time Overdue Highlighting**: Overdue follow-ups are surfaced with prominent red indicators.
- **Conversational Timeline Dialog**: Seamless slide-in modal without page transitions. View conversation histories chronologically (newest first) and log new discussions.
- **Atomic Operations**: Follow-up updates and discussion logs are persisted atomically within database transactions. Preserves scheduled follow-ups unless explicitly altered or cleared.
- **Interactive Search & Combined Filters**: Instant client-side and server-side filtering by name and status.
- **Real-Time Metrics Overview**: Summary cards showing Total Leads, Follow-ups Today, Overdue Follow-ups, and Won Leads.

---

## UI & Design System

The visual style is designed specifically to match modern fintech SaaS dashboards:
- Clean light theme with soft neutral background (`#F8FAFC`).
- High-contrast typography with Inter font.
- Muted, readable status badges with tailored border and background tokens.
- Restrained primary blue accents (`#2563EB`).
- Mobile and tablet responsive layouts.

---

## Architecture Overview

```
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
                      |      PostgreSQL / Hosted Cloud DB      |
                      |       (Supabase, Neon, or Aiven)      |
                      +---------------------------------------+
```

---

## Database Schema

### `leads` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | PRIMARY KEY | Unique lead identifier |
| `name` | `VARCHAR(255)` | NOT NULL, INDEXED | Full name of the lead |
| `company` | `VARCHAR(255)` | NULLABLE | Company / organization name |
| `phone` | `VARCHAR(50)` | NULLABLE | Contact telephone |
| `status` | `VARCHAR(50)` | NOT NULL, DEFAULT `'New'` | Current status |
| `next_follow_up_at` | `TIMESTAMPTZ` | NULLABLE, INDEXED | UTC timestamp for next follow-up |
| `created_at` | `TIMESTAMPTZ` | NOT NULL | Creation UTC timestamp |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL | Last update UTC timestamp |

### `discussions` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | PRIMARY KEY | Unique discussion identifier |
| `lead_id` | `UUID` | FOREIGN KEY (`leads.id`) ON DELETE CASCADE | Parent lead reference |
| `note` | `TEXT` | NOT NULL | Discussion content |
| `follow_up_at` | `TIMESTAMPTZ` | NULLABLE | Associated follow-up timestamp |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, INDEXED | Creation UTC timestamp |

---

## REST API Reference

All endpoints are prefixed with `/api/v1`:

### Leads & Stats
- `GET /api/v1/health`: Health status and database connectivity check.
- `GET /api/v1/leads/stats/summary`: Summary metrics (Total Leads, Follow-ups Today, Overdue, Won).
- `GET /api/v1/leads`: List leads with optional `query` (name search) and `status` filter.
- `POST /api/v1/leads`: Create a new lead (validates name, defaults status to `New`).
- `GET /api/v1/leads/{lead_id}`: Fetch detailed lead profile including timeline history.
- `PATCH /api/v1/leads/{lead_id}`: Update lead attributes (status, details, clear follow-up).

### Discussions
- `GET /api/v1/leads/{lead_id}/discussions`: Get all discussions for a lead ordered newest first.
- `POST /api/v1/leads/{lead_id}/discussions`: Add a new discussion note and optionally schedule or clear a follow-up (atomic transaction).

FastAPI Swagger interactive documentation is accessible at `http://localhost:8000/docs`.

---

## Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- **Database**: PostgreSQL (local or cloud provider such as Neon, Supabase, Render, Aiven) or persistent SQLite fallback.

---

## Environment Variables

Separate, dedicated environment files are provided for backend and frontend:

### 1. Backend (`backend/.env`)
```env
# Database Connection URL (PostgreSQL / Cloud Postgres such as Neon / Supabase):
DATABASE_URL=postgresql+psycopg://username:password@ep-host.region.aws.neon.tech/leadflow?sslmode=require

# Application Timezone
APP_TIMEZONE=Asia/Kolkata

# Backend Host & Port
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000

# Allowed CORS Origins (Comma-separated)
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 2. Frontend (`frontend/.env.local`)
```env
# FastAPI Backend URL
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Step-by-Step Setup

### Step 1: Clone and Set Up Virtual Environment

```bash
git clone <repository-url>
cd leadflow

# Create Python virtual environment
python -m venv backend/.venv

# Activate virtual environment
# On Windows (PowerShell):
backend\.venv\Scripts\Activate.ps1
# On macOS / Linux:
source backend/.venv/bin/activate

# Install Python backend dependencies
pip install -r backend/requirements.txt
```

### Step 2: Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## Database Migrations & Seeding

### Run Alembic Migrations
```bash
# Execute from workspace root
backend\.venv\Scripts\alembic.exe -c backend\alembic.ini upgrade head
```

### Run Idempotent Seed Script
Populates 6 realistic leads with varying statuses, notes, and follow-up dates:
```bash
backend\.venv\Scripts\python.exe backend\scripts\seed.py
```

---

## Running the Application

### 1. Start FastAPI Backend
```bash
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Backend will be available at: `http://localhost:8000`

### 2. Start Next.js Frontend
```bash
cd frontend
npm run dev -- -p 3000
```
Frontend will be available at: `http://localhost:3000`

---

## Running Tests

Run the complete automated backend test suite covering CRUD operations, status changes, discussion atomicity, follow-up calculations, and timezone boundaries:

```bash
backend\.venv\Scripts\pytest.exe -v
```

All 13 test suites execute in an isolated test environment and pass in under 1 second.

---

## Screenshots

### 1. Lead Management Dashboard
![LeadFlow Dashboard](docs/screenshots/dashboard.png)

### 2. Add New Lead Modal Dialog
![Add Lead Modal](docs/screenshots/add_lead_modal.png)

### 3. Lead Timeline & Discussion Log
![Lead Timeline](docs/screenshots/lead_timeline_modal.png)

---

## Cloud & Deployment Guidance

### Backend Deployment (Render / Railway / Cloud Run)
1. Set environment variables (`DATABASE_URL`, `APP_TIMEZONE`, `CORS_ORIGINS`).
2. Start command:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Frontend Deployment (Vercel)
1. Connect the Next.js project repository to Vercel.
2. Set `NEXT_PUBLIC_API_URL` to your production FastAPI API URL.
3. Deploy directly with zero configuration.

### Cloud Database (Neon / Supabase / Aiven)
Provide your PostgreSQL connection string in `DATABASE_URL` with SSL enabled:
```
postgresql+psycopg://<user>:<password>@<host>/<database>?sslmode=require
```
Alembic migrations will automatically apply all schema definitions.
