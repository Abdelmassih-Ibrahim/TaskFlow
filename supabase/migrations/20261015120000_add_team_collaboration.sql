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
  constraint unique_member_per_project unique(project_id, user_id),
  constraint no_self_invite check (invited_by != user_id)
);

create index if not exists project_members_project_id on public.project_members(project_id);
create index if not exists project_members_user_id on public.project_members(user_id);
create index if not exists project_members_joined_at on public.project_members(joined_at);

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

  constraint unique_pending_invite unique (project_id, email) where accepted_at is null,
  constraint valid_role check (role in ('viewer', 'editor', 'admin', 'reporter'))
);

create index if not exists invitations_email on public.invitations(email);
create index if not exists invitations_token on public.invitations(token);
create index if not exists invitations_project_id on public.invitations(project_id);

-- Add is_shared column to projects
alter table public.projects add column if not exists is_shared boolean default false;

-- Enable RLS on new tables
alter table public.project_members enable row level security;
alter table public.invitations enable row level security;

-- RLS Policies for project_members

-- Allow users to see members of projects they own
create policy if not exists "project_members_view_own_project"
  on public.project_members
  for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_members.project_id
        and projects.owner_id = auth.uid()
    )
  );

-- Allow users to see themselves as members
create policy if not exists "project_members_view_self"
  on public.project_members
  for select
  using (user_id = auth.uid());

-- Allow owners to insert members
create policy if not exists "project_members_insert_as_owner"
  on public.project_members
  for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_members.project_id
        and projects.owner_id = auth.uid()
    )
  );

-- Allow owners/admins to update members
create policy if not exists "project_members_update_as_admin"
  on public.project_members
  for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_members.project_id
        and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_members.project_id
        and projects.owner_id = auth.uid()
    )
  );

-- Allow owners to delete members
create policy if not exists "project_members_delete_as_owner"
  on public.project_members
  for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_members.project_id
        and projects.owner_id = auth.uid()
    )
  );

-- RLS Policies for invitations

-- Allow users to see invitations for projects they own
create policy if not exists "invitations_view_own_project"
  on public.invitations
  for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = invitations.project_id
        and projects.owner_id = auth.uid()
    )
  );

-- Allow users to see invitations sent to their email
create policy if not exists "invitations_view_own_email"
  on public.invitations
  for select
  using (
    email = (select email from auth.users where id = auth.uid())
  );

-- Allow owners to create invitations
create policy if not exists "invitations_insert_as_owner"
  on public.invitations
  for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = invitations.project_id
        and projects.owner_id = auth.uid()
    )
    and invited_by = auth.uid()
  );

-- Allow owners to update/cancel invitations
create policy if not exists "invitations_update_as_owner"
  on public.invitations
  for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = invitations.project_id
        and projects.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects
      where projects.id = invitations.project_id
        and projects.owner_id = auth.uid()
    )
  );

-- Allow owners to delete invitations
create policy if not exists "invitations_delete_as_owner"
  on public.invitations
  for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = invitations.project_id
        and projects.owner_id = auth.uid()
    )
  );

-- Update Projects RLS to allow member access

-- New policy: allow members to access shared projects
create policy if not exists "projects_select_members"
  on public.projects
  for select
  using (
    is_shared = true
    and exists (
      select 1 from public.project_members
      where project_members.project_id = projects.id
        and project_members.user_id = auth.uid()
        and project_members.joined_at is not null
    )
  );

-- Update Tasks RLS to allow member access

-- New policy: allow project members to select tasks
create policy if not exists "tasks_select_project_member"
  on public.tasks
  for select
  using (
    exists (
      select 1 from public.projects p
      join public.project_members m on p.id = m.project_id
      where p.id = tasks.project_id
        and m.user_id = auth.uid()
        and m.joined_at is not null
    )
  );

-- New policy: allow editors/admins to insert tasks
create policy if not exists "tasks_insert_project_member"
  on public.tasks
  for insert
  with check (
    exists (
      select 1 from public.projects p
      join public.project_members m on p.id = m.project_id
      where p.id = tasks.project_id
        and m.user_id = auth.uid()
        and m.joined_at is not null
        and m.role in ('editor', 'admin')
    )
  );

-- New policy: allow editors/admins to update tasks
create policy if not exists "tasks_update_project_member"
  on public.tasks
  for update
  using (
    exists (
      select 1 from public.projects p
      join public.project_members m on p.id = m.project_id
      where p.id = tasks.project_id
        and m.user_id = auth.uid()
        and m.joined_at is not null
        and m.role in ('editor', 'admin')
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      join public.project_members m on p.id = m.project_id
      where p.id = tasks.project_id
        and m.user_id = auth.uid()
        and m.joined_at is not null
        and m.role in ('editor', 'admin')
    )
  );

-- New policy: allow admins to delete tasks
create policy if not exists "tasks_delete_project_member"
  on public.tasks
  for delete
  using (
    exists (
      select 1 from public.projects p
      join public.project_members m on p.id = m.project_id
      where p.id = tasks.project_id
        and m.user_id = auth.uid()
        and m.joined_at is not null
        and m.role = 'admin'
    )
  );

-- Helper function to generate invite tokens
create or replace function public.generate_invite_token()
returns text as $$
begin
  return gen_random_uuid()::text || '-' || gen_random_uuid()::text;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at on project_members
create or replace function public.set_project_members_timestamps()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_project_members_timestamps on public.project_members;
create trigger set_project_members_timestamps
before update on public.project_members
for each row
execute function public.set_project_members_timestamps();
