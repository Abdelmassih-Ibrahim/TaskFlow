-- Create project_members table
create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'viewer',
  invited_by uuid references auth.users (id) on delete set null,
  invited_at timestamptz default now(),
  joined_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint valid_role check (role in ('viewer', 'editor', 'admin', 'reporter')),
  constraint unique_member_per_project unique(project_id, user_id)
);

create index if not exists project_members_project_id on public.project_members(project_id);
create index if not exists project_members_user_id on public.project_members(user_id);

-- Create invitations table
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  email text not null,
  role text not null default 'editor',
  invited_by uuid not null references auth.users (id) on delete cascade,
  token text unique not null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now(),

  constraint valid_role check (role in ('viewer', 'editor', 'admin', 'reporter'))
);

create unique index if not exists invitations_unique_pending
  on public.invitations(project_id, email)
  where accepted_at is null;

create index if not exists invitations_email on public.invitations(email);
create index if not exists invitations_token on public.invitations(token);

-- Add is_shared column to projects
alter table public.projects add column if not exists is_shared boolean default false;

-- Enable RLS
alter table public.project_members enable row level security;
alter table public.invitations enable row level security;

-- RLS Policies for project_members
create policy "project_members_view_own_project" on public.project_members
  for select using (
    exists (select 1 from public.projects where projects.id = project_members.project_id and projects.owner_id = auth.uid())
  );

create policy "project_members_view_self" on public.project_members
  for select using (user_id = auth.uid());

create policy "project_members_insert_as_owner" on public.project_members
  for insert with check (
    exists (select 1 from public.projects where projects.id = project_members.project_id and projects.owner_id = auth.uid())
  );

create policy "project_members_update_as_owner" on public.project_members
  for update using (
    exists (select 1 from public.projects where projects.id = project_members.project_id and projects.owner_id = auth.uid())
  );

create policy "project_members_delete_as_owner" on public.project_members
  for delete using (
    exists (select 1 from public.projects where projects.id = project_members.project_id and projects.owner_id = auth.uid())
  );

-- RLS Policies for invitations
create policy "invitations_view_own_project" on public.invitations
  for select using (
    exists (select 1 from public.projects where projects.id = invitations.project_id and projects.owner_id = auth.uid())
  );

create policy "invitations_view_own_email" on public.invitations
  for select using (
    email = (select email from auth.users where id = auth.uid())
  );

create policy "invitations_insert_as_owner" on public.invitations
  for insert with check (
    exists (select 1 from public.projects where projects.id = invitations.project_id and projects.owner_id = auth.uid())
    and invited_by = auth.uid()
  );

create policy "invitations_update_as_owner" on public.invitations
  for update using (
    exists (select 1 from public.projects where projects.id = invitations.project_id and projects.owner_id = auth.uid())
  );

create policy "invitations_delete_as_owner" on public.invitations
  for delete using (
    exists (select 1 from public.projects where projects.id = invitations.project_id and projects.owner_id = auth.uid())
  );
