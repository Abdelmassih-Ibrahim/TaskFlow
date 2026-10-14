# TaskFlow

TaskFlow is a project and task management app in progress. Email registration and sign-in use Supabase Auth, while the dashboard itself remains a sample-data preview. The repository also defines a versioned Supabase schema and database-level access policies for future project and task features.

> **Dashboard demo only:** The dashboard's sample tasks and projects are illustrative and are not saved. The Next.js app uses Supabase Auth for accounts and sessions, but does not yet read or write project/task data. Project/task editing has not been implemented.

## Prerequisites

- A currently supported Node.js LTS release. Next.js 16 requires Node.js 20.9 or later; Node.js 26.7.0 was used for this milestone.
- npm, included with Node.js.
- Docker Desktop, running, for the local Supabase database and RLS tests.
- A Supabase project (hosted or local) and its URL and publishable key to use authentication.

## Run locally

From the repository root:

```powershell
npm.cmd install
npm.cmd run db:start
```

Copy `.env.example` to `.env.local`, then use the local Supabase API URL and publishable key printed by `npm.cmd run db:start`:

```powershell
Copy-Item .env.example .env.local
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` in `.env.local`. For local Supabase, the URL is usually `http://127.0.0.1:54321`; use the **Publishable key** shown in the CLI output, not the secret key. The local site URL is `http://localhost:3000`.

Then start the app:

```powershell
npm.cmd run dev
```

Open [http://localhost:3000](http://localhost:3000). If using a hosted project instead, create it in Supabase and use its Project URL and publishable key from the project's API settings. Restart the Next.js server after editing `.env.local`. In PowerShell, use `npm.cmd` because the default script execution policy may block `npm.ps1`.

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

## Authentication setup

The public routes are `/login` and `/register`. Registration validates email and password, checks the repeated password, and uses Supabase Auth. If email confirmation is enabled, the confirmation link returns through `/auth/callback`; after sign-in, the dashboard is available at `/`.

For local Auth, start the Supabase stack as above. The local configuration uses `http://localhost:3000` as its site URL and allows the `/auth/callback` redirect. Email confirmations are disabled by default for the local stack, so a successful registration signs in immediately. If you enable confirmations, use the local Inbucket mail viewer to open the confirmation email.

For a hosted Supabase project:

1. Enable the Email provider in **Authentication → Sign In / Providers**.
2. Set the project's **Site URL** to the deployed app origin (or `http://localhost:3000` for local development).
3. Add the exact callback URL, such as `http://localhost:3000/auth/callback`, under **Authentication → URL Configuration → Redirect URLs**. Add the deployed app's callback URL when deploying.
4. Copy `.env.example` to `.env.local` and fill in the project URL, publishable key, and app site URL. Do not use a service-role/secret key.

The login and registration forms submit through server actions. Supabase Auth sessions are stored in cookies using `@supabase/ssr`; the Next.js 16 `proxy.ts` refreshes and verifies token claims, while the protected route-group layout independently calls Supabase `getUser()` before rendering the dashboard. Missing configuration or invalid sessions cannot expose the protected page. The database RLS policies remain the authorization boundary for future project/task data; authentication alone does not grant access to records.

Authentication requires a configured Supabase Auth service to work end-to-end. Unit tests cover local validation and safe error messages without credentials; they do not prove live sign-in, registration, email delivery, session refresh, or hosted-project RLS behavior.

## Local database and security tests

The migration in `supabase/migrations/` defines `projects` and `tasks`. Both tables enable RLS. Project operations check the signed-in user's ownership; task operations check ownership of the task's parent project. Separate policies cover SELECT, INSERT, UPDATE, and DELETE, with UPDATE validating both the existing and resulting row. The database also constrains names, descriptions, statuses, and priorities, manages timestamps, and cascades task deletion with its project.

Start and test the local schema:

```powershell
npm.cmd run db:start
npm.cmd run db:reset
npm.cmd run db:lint
npm.cmd run db:test
```

The pgTAP tests use synthetic users and verify allowed owner operations, denied cross-user access and reassignment, anonymous-role grants, schema constraints, timestamps, and deletion behavior. They run only against the local Supabase stack; passing them is evidence for the tested database policies, not a claim that the application is production-secure.

Stop the local services with:

```powershell
npm.cmd run db:stop
```

Local schema development and testing do not require a hosted Supabase project or application environment variables. Applying migrations to a hosted project is a separate, deliberate step: create the project, authenticate and link the Supabase CLI locally, review the migration target, and then use the CLI's `db push` command. Do not share the database password or CLI credentials.

The application uses `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` from an ignored local `.env.local` file. These contain the public project URL, publishable key, and app origin; never put a service-role/secret key in a `NEXT_PUBLIC_` variable or browser code.

## Current functionality

- Responsive TaskFlow dashboard shell with desktop sidebar and mobile navigation.
- Overview cards for total, completed, and overdue tasks.
- Task table showing sample projects, due dates, priorities, statuses, and demo assignees.
- Clear demo-data notices; navigation for features not yet available is visibly disabled.
- Supabase Auth email registration, sign-in, sign-out, confirmation callback, and protected dashboard route.
- Unit tests for summary counts and due-date labels.
- Credential-free unit tests for authentication input validation and safe error messages.

The sample profile, projects, people, and tasks are invented example content for the interface preview. They do not represent real accounts or saved work.

## Not implemented yet

- Password reset, OAuth, multi-factor authentication, and account management.
- Next.js reads/writes against Supabase and persisted dashboard data.
- Creating, editing, deleting, searching, or filtering projects and tasks.
- Working calendar, reports, settings, or team collaboration.
- End-to-end tests, CI, or deployment configuration.

The schema and RLS rules are defined and covered by local pgTAP tests, but have not been applied to a hosted project or connected to project/task data in the application. Live authentication remains unverified until configured against a Supabase project. No remote database migrations or deployment have been performed.

## Technology

- Next.js App Router and React
- TypeScript (strict mode)
- Tailwind CSS
- Lucide icons
- Vitest
- Zod
- Supabase Auth with `@supabase/ssr`
- Supabase CLI and PostgreSQL (local development and database tests)
