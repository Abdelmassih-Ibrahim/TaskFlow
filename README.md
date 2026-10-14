# TaskFlow

TaskFlow is a project and task management app in progress. This repository currently contains the first milestone: a responsive dashboard preview populated with sample data.

> **Demo only:** Task and project details are illustrative and are not saved. Authentication, a database, and task/project editing have not been implemented.

## Prerequisites

- Node.js 20.9 or later (Node.js 26.7 was used for this milestone).
- npm, included with Node.js.

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
```

## Current functionality

- Responsive TaskFlow dashboard shell with desktop sidebar and mobile navigation.
- Overview cards for total, completed, and overdue tasks.
- Task table showing sample projects, due dates, priorities, statuses, and demo assignees.
- Clear demo-data notices; navigation for features not yet available is visibly disabled.
- Unit tests for summary counts and due-date labels.

The sample profile, projects, people, and tasks are invented example content for the interface preview. They do not represent real accounts or saved work.

## Not implemented yet

- Sign-up, sign-in, sessions, and authorization.
- Supabase, PostgreSQL, migrations, or persistent storage.
- Creating, editing, deleting, searching, or filtering projects and tasks.
- Working calendar, reports, settings, or team collaboration.
- End-to-end tests, CI, or deployment configuration.

These features will be added in later milestones after the foundation is reviewed. No Supabase credentials or environment variables are needed for this preview.

## Technology

- Next.js App Router and React
- TypeScript (strict mode)
- Tailwind CSS
- Lucide icons
- Vitest
