create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_name_length
    check (name ~ '[^[:space:]]' and char_length(name) <= 120),
  constraint projects_description_length
    check (description is null or char_length(description) <= 2000)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo',
  priority text not null default 'medium',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_length
    check (title ~ '[^[:space:]]' and char_length(title) <= 200),
  constraint tasks_description_length
    check (description is null or char_length(description) <= 5000),
  constraint tasks_status_allowed
    check (status in ('todo', 'in_progress', 'done')),
  constraint tasks_priority_allowed
    check (priority in ('low', 'medium', 'high'))
);

create index projects_owner_updated_at_idx
  on public.projects (owner_id, updated_at desc);

create index tasks_project_status_due_date_idx
  on public.tasks (project_id, status, due_date);

create or replace function public.set_row_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := pg_catalog.clock_timestamp();
    new.updated_at := new.created_at;
  else
    new.created_at := old.created_at;
    new.updated_at := pg_catalog.clock_timestamp();
  end if;

  return new;
end;
$$;

revoke all on function public.set_row_timestamps() from public, anon, authenticated;

create trigger projects_set_row_timestamps
before insert or update on public.projects
for each row
execute function public.set_row_timestamps();

create trigger tasks_set_row_timestamps
before insert or update on public.tasks
for each row
execute function public.set_row_timestamps();

alter table public.projects enable row level security;
alter table public.tasks enable row level security;

revoke all on table public.projects, public.tasks from public, anon, authenticated;
grant select, insert, update, delete on table public.projects, public.tasks
  to authenticated;

create policy projects_select_own
  on public.projects
  for select
  to authenticated
  using (owner_id = (select auth.uid()));

create policy projects_insert_own
  on public.projects
  for insert
  to authenticated
  with check (owner_id = (select auth.uid()));

create policy projects_update_own
  on public.projects
  for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy projects_delete_own
  on public.projects
  for delete
  to authenticated
  using (owner_id = (select auth.uid()));

create policy tasks_select_project_owner
  on public.tasks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.projects as parent
      where parent.id = tasks.project_id
        and parent.owner_id = (select auth.uid())
    )
  );

create policy tasks_insert_project_owner
  on public.tasks
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.projects as parent
      where parent.id = tasks.project_id
        and parent.owner_id = (select auth.uid())
    )
  );

create policy tasks_update_project_owner
  on public.tasks
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.projects as parent
      where parent.id = tasks.project_id
        and parent.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.projects as parent
      where parent.id = tasks.project_id
        and parent.owner_id = (select auth.uid())
    )
  );

create policy tasks_delete_project_owner
  on public.tasks
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.projects as parent
      where parent.id = tasks.project_id
        and parent.owner_id = (select auth.uid())
    )
  );
