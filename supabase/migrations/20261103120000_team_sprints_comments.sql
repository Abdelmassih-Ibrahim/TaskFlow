-- Team, sprints, comments, activity and ordering. Safe to run once after 20261015120000.

-- 1. Helper functions (security definer avoids RLS recursion between projects and project_members)
create or replace function public.is_project_owner(p_project_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.id = p_project_id and p.owner_id = auth.uid()
  );
$$;

create or replace function public.project_role(p_project_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when public.is_project_owner(p_project_id) then 'owner'
    else (
      select m.role from public.project_members m
      where m.project_id = p_project_id
        and m.user_id = auth.uid()
        and m.joined_at is not null
    )
  end;
$$;

create or replace function public.task_project_role(p_task_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select public.project_role(t.project_id) from public.tasks t where t.id = p_task_id;
$$;

-- 2. Columns
alter table public.project_members add column if not exists user_email text;
alter table public.tasks add column if not exists assignee_id uuid references auth.users (id) on delete set null;
alter table public.tasks add column if not exists labels text[] not null default '{}';
alter table public.tasks add column if not exists position double precision not null default 0;

-- 3. Sprints
create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  constraint sprint_dates_order check (starts_on is null or ends_on is null or starts_on <= ends_on)
);

alter table public.tasks add column if not exists sprint_id uuid references public.sprints (id) on delete set null;
create index if not exists tasks_sprint_id on public.tasks (sprint_id);
create index if not exists tasks_assignee_id on public.tasks (assignee_id);

-- 4. Comments and activity
create table if not exists public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists task_comments_task_id on public.task_comments (task_id, created_at);

create table if not exists public.task_activity (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);
create index if not exists task_activity_task_id on public.task_activity (task_id, created_at);

create or replace function public.log_task_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_activity (task_id, actor_id, message)
    values (new.id, auth.uid(), 'Skapade uppgiften');
    return new;
  end if;

  if new.title is distinct from old.title then
    insert into public.task_activity (task_id, actor_id, message)
    values (new.id, auth.uid(), 'Ändrade titeln');
  end if;
  if new.status is distinct from old.status then
    insert into public.task_activity (task_id, actor_id, message)
    values (new.id, auth.uid(), 'Ändrade status från ' || old.status || ' till ' || new.status);
  end if;
  if new.priority is distinct from old.priority then
    insert into public.task_activity (task_id, actor_id, message)
    values (new.id, auth.uid(), 'Ändrade prioritet till ' || new.priority);
  end if;
  if new.due_date is distinct from old.due_date then
    insert into public.task_activity (task_id, actor_id, message)
    values (new.id, auth.uid(), 'Ändrade förfallodatum');
  end if;
  if new.assignee_id is distinct from old.assignee_id then
    insert into public.task_activity (task_id, actor_id, message)
    values (new.id, auth.uid(), 'Ändrade tilldelning');
  end if;
  if new.sprint_id is distinct from old.sprint_id then
    insert into public.task_activity (task_id, actor_id, message)
    values (new.id, auth.uid(), 'Ändrade sprint');
  end if;
  return new;
end;
$$;

drop trigger if exists tasks_log_changes on public.tasks;
create trigger tasks_log_changes
  after insert or update on public.tasks
  for each row execute function public.log_task_changes();

-- 5. Owner is always a member row, so the team list shows everyone
create or replace function public.add_owner_membership()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.project_members (project_id, user_id, role, joined_at, user_email)
  values (
    new.id,
    new.owner_id,
    'admin',
    now(),
    (select u.email from auth.users u where u.id = new.owner_id)
  )
  on conflict (project_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists projects_add_owner_membership on public.projects;
create trigger projects_add_owner_membership
  after insert on public.projects
  for each row execute function public.add_owner_membership();

insert into public.project_members (project_id, user_id, role, joined_at, user_email)
select p.id, p.owner_id, 'admin', now(), u.email
from public.projects p
join auth.users u on u.id = p.owner_id
on conflict (project_id, user_id) do nothing;

update public.project_members pm
set user_email = u.email
from auth.users u
where u.id = pm.user_id and pm.user_email is null;

-- 6. Accept invitation (the invitee cannot insert into project_members directly)
create or replace function public.accept_invitation(p_token text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  inv public.invitations%rowtype;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Du måste vara inloggad för att acceptera inbjudan.';
  end if;

  select * into inv from public.invitations where token = p_token;
  if not found then
    raise exception 'Inbjudan hittades inte.';
  end if;
  if inv.accepted_at is not null then
    raise exception 'Inbjudan har redan använts.';
  end if;
  if inv.expires_at < now() then
    raise exception 'Inbjudan har gått ut. Be om en ny.';
  end if;

  select u.email into v_email from auth.users u where u.id = auth.uid();
  if lower(coalesce(v_email, '')) <> lower(inv.email) then
    raise exception 'Inbjudan är skickad till en annan e-postadress.';
  end if;

  if exists (
    select 1 from public.projects p where p.id = inv.project_id and p.owner_id = auth.uid()
  ) then
    raise exception 'Du äger redan detta projekt.';
  end if;

  insert into public.project_members (project_id, user_id, role, invited_by, joined_at, user_email)
  values (inv.project_id, auth.uid(), inv.role, inv.invited_by, now(), v_email)
  on conflict (project_id, user_id) do update
    set role = excluded.role,
        joined_at = coalesce(public.project_members.joined_at, excluded.joined_at),
        user_email = excluded.user_email;

  update public.invitations set accepted_at = now() where id = inv.id;
  return inv.project_id;
end;
$$;

revoke all on function public.accept_invitation(text) from public;
grant execute on function public.accept_invitation(text) to authenticated;

-- 7. RLS: project_members
alter table public.project_members enable row level security;

drop policy if exists "project_members_view_own_project" on public.project_members;
drop policy if exists "project_members_view_self" on public.project_members;
drop policy if exists "project_members_insert_as_owner" on public.project_members;
drop policy if exists "project_members_update_as_owner" on public.project_members;
drop policy if exists "project_members_update_as_admin" on public.project_members;
drop policy if exists "project_members_delete_as_owner" on public.project_members;
drop policy if exists "project_members_select" on public.project_members;
drop policy if exists "project_members_insert_owner" on public.project_members;
drop policy if exists "project_members_update_owner" on public.project_members;
drop policy if exists "project_members_delete" on public.project_members;

create policy "project_members_select" on public.project_members
  for select to authenticated
  using (user_id = auth.uid() or public.project_role(project_id) is not null);

create policy "project_members_insert_owner" on public.project_members
  for insert to authenticated
  with check (public.is_project_owner(project_id));

create policy "project_members_update_owner" on public.project_members
  for update to authenticated
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

create policy "project_members_delete" on public.project_members
  for delete to authenticated
  using (public.is_project_owner(project_id) or user_id = auth.uid());

-- 8. RLS: invitations
alter table public.invitations enable row level security;

drop policy if exists "invitations_view_own_project" on public.invitations;
drop policy if exists "invitations_view_own_email" on public.invitations;
drop policy if exists "invitations_insert_as_owner" on public.invitations;
drop policy if exists "invitations_update_as_owner" on public.invitations;
drop policy if exists "invitations_delete_as_owner" on public.invitations;
drop policy if exists "invitations_select" on public.invitations;
drop policy if exists "invitations_insert_owner" on public.invitations;
drop policy if exists "invitations_update_owner" on public.invitations;
drop policy if exists "invitations_delete_owner" on public.invitations;

create policy "invitations_select" on public.invitations
  for select to authenticated
  using (
    public.is_project_owner(project_id)
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy "invitations_insert_owner" on public.invitations
  for insert to authenticated
  with check (public.is_project_owner(project_id) and invited_by = auth.uid());

create policy "invitations_update_owner" on public.invitations
  for update to authenticated
  using (public.is_project_owner(project_id))
  with check (public.is_project_owner(project_id));

create policy "invitations_delete_owner" on public.invitations
  for delete to authenticated
  using (public.is_project_owner(project_id));

-- 9. RLS: projects and tasks for members
drop policy if exists "projects_select_members" on public.projects;
create policy "projects_select_members" on public.projects
  for select to authenticated
  using (public.project_role(id) is not null);

drop policy if exists "tasks_select_project_member" on public.tasks;
drop policy if exists "tasks_insert_project_member" on public.tasks;
drop policy if exists "tasks_update_project_member" on public.tasks;
drop policy if exists "tasks_delete_project_member" on public.tasks;
drop policy if exists "tasks_member_select" on public.tasks;
drop policy if exists "tasks_member_insert" on public.tasks;
drop policy if exists "tasks_member_update" on public.tasks;
drop policy if exists "tasks_member_delete" on public.tasks;

create policy "tasks_member_select" on public.tasks
  for select to authenticated
  using (public.project_role(project_id) is not null);

create policy "tasks_member_insert" on public.tasks
  for insert to authenticated
  with check (public.project_role(project_id) in ('owner', 'admin', 'editor'));

create policy "tasks_member_update" on public.tasks
  for update to authenticated
  using (public.project_role(project_id) in ('owner', 'admin', 'editor'))
  with check (public.project_role(project_id) in ('owner', 'admin', 'editor'));

create policy "tasks_member_delete" on public.tasks
  for delete to authenticated
  using (public.project_role(project_id) in ('owner', 'admin'));

-- 10. RLS: sprints, comments, activity
alter table public.sprints enable row level security;
alter table public.task_comments enable row level security;
alter table public.task_activity enable row level security;

create policy "sprints_select" on public.sprints
  for select to authenticated
  using (public.project_role(project_id) is not null);
create policy "sprints_insert" on public.sprints
  for insert to authenticated
  with check (public.project_role(project_id) in ('owner', 'admin'));
create policy "sprints_update" on public.sprints
  for update to authenticated
  using (public.project_role(project_id) in ('owner', 'admin'))
  with check (public.project_role(project_id) in ('owner', 'admin'));
create policy "sprints_delete" on public.sprints
  for delete to authenticated
  using (public.project_role(project_id) in ('owner', 'admin'));

create policy "task_comments_select" on public.task_comments
  for select to authenticated
  using (public.task_project_role(task_id) is not null);
create policy "task_comments_insert" on public.task_comments
  for insert to authenticated
  with check (author_id = auth.uid() and public.task_project_role(task_id) is not null);
create policy "task_comments_delete_own" on public.task_comments
  for delete to authenticated
  using (author_id = auth.uid());

create policy "task_activity_select" on public.task_activity
  for select to authenticated
  using (public.task_project_role(task_id) is not null);

grant select, insert, update, delete on public.sprints, public.task_comments, public.project_members, public.invitations to authenticated;
grant select on public.task_activity to authenticated;
revoke all on public.sprints, public.task_comments, public.task_activity, public.project_members, public.invitations from anon;
