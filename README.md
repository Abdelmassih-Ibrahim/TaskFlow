# TaskFlow

TaskFlow is a project and task management app in progress. The dashboard is still a sample-data preview. The repository also defines a versioned Supabase schema and database-level access policies for future project and task features.

> **Dashboard demo only:** The dashboard's sample tasks and projects are illustrative and are not saved. The SQL schema and Row Level Security (RLS) policies exist, but the Next.js app is not connected to Supabase. Authentication and project/task editing have not been implemented.

## Prerequisites

- A currently supported Node.js LTS release. Next.js 16 requires Node.js 20.9 or later; Node.js 26.7.0 was used for this milestone.
- npm, included with Node.js.
- Docker Desktop, running, for the local Supabase database and RLS tests.

## Run locally

From the repository root:

```powershell
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). In PowerShell, use `npm.cmd` because the default script execution policy may block `npm.ps1`.

## Available commands

```powershell
npm.cmd run dev        # Start the local development server
npm.cmd run lint       # Check code with ESLint
npm.cmd run typecheck  # Check TypeScript types
npm.cmd test           # Run the unit tests once
npm.cmd run build      # Create a production build
npm.cmd start          # Serve the production build (after building)
npm.cmd run db:start   # Start the local Supabase stack (requires Docker)
npm.cmd run db:reset   # Recreate the local database from migrations
npm.cmd run db:lint    # Check the local database schema
npm.cmd run db:test    # Run pgTAP schema and RLS tests
npm.cmd run db:stop    # Stop the local Supabase stack
```

The Supabase CLI is pinned as a project development dependency and is available after `npm.cmd install`. Start Docker Desktop before running database commands. The first `db:start` downloads local service images.

## Local database and security tests

The migration in `supabase/migrations/` defines `projects` and `tasks`. Both tables enable RLS. Project operations check the signed-in user's ownership; task operations check ownership of the task's parent project. Separate policies cover SELECT, INSERT, UPDATE, and DELETE, with UPDATE validating both the existing and resulting row. The database also constrains names, descriptions, statuses, and priorities, manages timestamps, and cascades task deletion with its project.

Start and test the local schema:

```powershell
npm.cmd run db:start
npm.cmd run db:reset
npm.cmd run db:lint
npm.cmd run db:test
```

The pgTAP tests use synthetic users and verify allowed owner operations, denied cross-user access and reassignment, anonymous-role grants, schema constraints, timestamps, and deletion behavior. They run only against the local Supabase stack; passing them is evidence for the tested database policies, not a claim that the application already uses authentication or is production-secure.

Stop the local services with:

```powershell
npm.cmd run db:stop
```

Local schema development and testing do not require a hosted Supabase project or application environment variables. Applying migrations to a hosted project is a separate, deliberate step: create the project, authenticate and link the Supabase CLI locally, review the migration target, and then use the CLI's `db push` command. Do not share the database password or CLI credentials.

When a future milestone connects the Next.js app, it will need `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in an ignored local `.env.local` file. Never expose a service-role/secret key in a `NEXT_PUBLIC_` variable or browser code.

## Current functionality

- Responsive TaskFlow dashboard shell with desktop sidebar and mobile navigation.
- Overview cards for total, completed, and overdue tasks.
- Task table showing sample projects, due dates, priorities, statuses, and demo assignees.
- Clear demo-data notices; navigation for features not yet available is visibly disabled.
- Unit tests for summary counts and due-date labels.

The sample profile, projects, people, and tasks are invented example content for the interface preview. They do not represent real accounts or saved work.

## Not implemented yet

- Sign-up, sign-in, sessions, and authorization.
- Next.js reads/writes against Supabase and persisted dashboard data.
- Creating, editing, deleting, searching, or filtering projects and tasks.
- Working calendar, reports, settings, or team collaboration.
- End-to-end tests, CI, or deployment configuration.

The schema and RLS rules are defined and covered by local pgTAP tests, but have not been applied to a hosted project or connected to the application. No hosted credentials or app environment variables are needed for the dashboard preview or local database tests.

## Technology

- Next.js App Router and React
- TypeScript (strict mode)
- Tailwind CSS
- Lucide icons
- Vitest
- Supabase CLI and PostgreSQL (local development and database tests)
