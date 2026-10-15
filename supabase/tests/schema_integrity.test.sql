create extension if not exists pgtap with schema extensions;

begin;
select extensions.plan(22);

insert into auth.users (id, email)
values ('33333333-3333-4333-8333-333333333333', 'schema@example.test');

select extensions.has_table('public', 'projects', 'projects table exists');
select extensions.has_table('public', 'tasks', 'tasks table exists');
select extensions.col_is_pk('public', 'projects', 'id', 'projects.id is primary key');
select extensions.col_is_pk('public', 'tasks', 'id', 'tasks.id is primary key');
select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and indexname = 'projects_owner_updated_at_idx'
  ),
  'projects has an owner/update index'
);
select extensions.ok(
  exists (
    select 1
    from pg_catalog.pg_indexes
    where schemaname = 'public'
      and indexname = 'tasks_project_status_due_date_idx'
  ),
  'tasks has a project/status/due-date index'
);

select extensions.throws_ok(
  $$insert into public.projects (owner_id, name)
    values ('33333333-3333-4333-8333-333333333333', E' \t\n ')$$,
  '23514',
  null,
  'project names cannot be blank'
);
select extensions.throws_ok(
  $$insert into public.projects (owner_id, name)
    values (
      '33333333-3333-4333-8333-333333333333',
      repeat('x', 121)
    )$$,
  '23514',
  null,
  'project names cannot exceed 120 characters'
);
select extensions.throws_ok(
  $$insert into public.projects (owner_id, name, description)
    values (
      '33333333-3333-4333-8333-333333333333',
      'Long description',
      repeat('x', 2001)
    )$$,
  '23514',
  null,
  'project descriptions cannot exceed 2000 characters'
);

insert into public.projects (id, owner_id, name, created_at, updated_at)
values (
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  '33333333-3333-4333-8333-333333333333',
  'Schema test project',
  '2000-01-01 00:00:00+00',
  '2000-01-01 00:00:00+00'
);

select extensions.throws_ok(
  $$insert into public.tasks (project_id, title)
    values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', E' \t\n ')$$,
  '23514',
  null,
  'task titles cannot be blank'
);
select extensions.throws_ok(
  $$insert into public.tasks (project_id, title)
    values (
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      repeat('x', 201)
    )$$,
  '23514',
  null,
  'task titles cannot exceed 200 characters'
);
select extensions.throws_ok(
  $$insert into public.tasks (project_id, title, description)
    values (
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      'Long description',
      repeat('x', 5001)
    )$$,
  '23514',
  null,
  'task descriptions cannot exceed 5000 characters'
);
select extensions.throws_ok(
  $$insert into public.tasks (project_id, title, status)
    values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Invalid status', 'blocked')$$,
  '23514',
  null,
  'task status must be one of the supported values'
);
select extensions.throws_ok(
  $$insert into public.tasks (project_id, title, priority)
    values ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'Invalid priority', 'urgent')$$,
  '23514',
  null,
  'task priority must be one of the supported values'
);
select extensions.throws_ok(
  $$insert into public.tasks (project_id, title)
    values ('99999999-9999-4999-8999-999999999999', 'Missing project')$$,
  '23503',
  null,
  'tasks must reference an existing project'
);

select extensions.results_eq(
  $$select created_at = updated_at
    from public.projects
    where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'$$,
  array[true],
  'project insert timestamps are set by the database'
);
update public.projects
set name = 'Updated schema test project',
    created_at = '1900-01-01 00:00:00+00',
    updated_at = '1900-01-01 00:00:00+00'
where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
select extensions.ok(
  (
    select created_at > '2000-01-01 00:00:00+00'::timestamptz
      and updated_at > created_at
    from public.projects
    where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ),
  'project updates preserve created_at and refresh updated_at'
);

insert into public.tasks (id, project_id, title, created_at, updated_at)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  'Schema test task',
  '2000-01-01 00:00:00+00',
  '2000-01-01 00:00:00+00'
);

select extensions.results_eq(
  $$select created_at = updated_at
    from public.tasks
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'$$,
  array[true],
  'task insert timestamps are set by the database'
);
update public.tasks
set title = 'Updated schema test task',
    created_at = '1900-01-01 00:00:00+00',
    updated_at = '1900-01-01 00:00:00+00'
where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
select extensions.ok(
  (
    select created_at > '2000-01-01 00:00:00+00'::timestamptz
      and updated_at > created_at
    from public.tasks
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  ),
  'task updates preserve created_at and refresh updated_at'
);

insert into public.projects (id, owner_id, name)
values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  '33333333-3333-4333-8333-333333333333',
  'Cascade test project'
);
insert into public.tasks (id, project_id, title)
values (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  'Cascade test task'
);
delete from public.projects
where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
select extensions.ok(
  not exists (
    select 1
    from public.tasks
    where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
  ),
  'deleting a project cascades to its tasks'
);

delete from auth.users
where id = '33333333-3333-4333-8333-333333333333';
select extensions.ok(
  not exists (
    select 1
    from public.projects
    where id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
  ),
  'deleting a user cascades to their projects'
);
select extensions.ok(
  not exists (
    select 1
    from public.tasks
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
  ),
  'deleting a user cascades through projects to tasks'
);

select * from extensions.finish();
rollback;
