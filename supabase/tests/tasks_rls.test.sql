create extension if not exists pgtap with schema extensions;

begin;
select extensions.plan(24);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'tasks-owner@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'tasks-other@example.test');

insert into public.projects (id, owner_id, name)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '11111111-1111-4111-8111-111111111111',
    'Owner project'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    '22222222-2222-4222-8222-222222222222',
    'Other user project'
  );

insert into public.tasks (id, project_id, title)
values (
  'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'Owner task'
);

select extensions.policies_are(
  'public',
  'tasks',
  array[
    'tasks_delete_project_owner',
    'tasks_insert_project_owner',
    'tasks_select_project_owner',
    'tasks_update_project_owner'
  ],
  'tasks has one explicit parent-ownership policy per operation'
);
select extensions.ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.tasks'::regclass),
  'RLS is enabled on tasks'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.tasks', 'select,insert,update,delete'),
  'anon has no task privileges'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.tasks', 'select,insert,update,delete'),
  'authenticated has the CRUD grant required by the app'
);

set local role anon;
select extensions.throws_ok(
  $$select * from public.tasks$$,
  '42501',
  null,
  'anon cannot read tasks'
);
select extensions.throws_ok(
  $$insert into public.tasks (project_id, title)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Anonymous task')$$,
  '42501',
  null,
  'anon cannot insert tasks'
);
select extensions.throws_ok(
  $$update public.tasks set title = 'Anonymous update'$$,
  '42501',
  null,
  'anon cannot update tasks'
);
select extensions.throws_ok(
  $$delete from public.tasks$$,
  '42501',
  null,
  'anon cannot delete tasks'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select extensions.results_eq(
  $$insert into public.tasks (id, project_id, title)
    values (
      'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'New owner task'
    )
    returning title$$,
  array['New owner task'],
  'a project owner can create a task in their project'
);
select extensions.results_eq(
  $$select title from public.tasks
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'$$,
  array['Owner task'],
  'a project owner can read a task in their project'
);
select extensions.results_eq(
  $$update public.tasks set title = 'Updated owner task'
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    returning title$$,
  array['Updated owner task'],
  'a project owner can update a task in their project'
);
select extensions.throws_ok(
  $$update public.tasks
    set project_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'$$,
  '42501',
  null,
  'a project owner cannot move a task into another user project'
);
select extensions.ok(
  exists (
    select 1
    from public.tasks
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and project_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      and title = 'Updated owner task'
  ),
  'a rejected task move leaves its original project and data unchanged'
);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select extensions.throws_ok(
  $$insert into public.tasks (project_id, title)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Spoofed task')$$,
  '42501',
  null,
  'a user cannot create a task in another user project'
);
select extensions.results_eq(
  $$insert into public.tasks (id, project_id, title)
    values (
      'ffffffff-ffff-4fff-8fff-ffffffffffff',
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      'Other user task'
    )
    returning title$$,
  array['Other user task'],
  'the other project owner can create a task in their project'
);
select extensions.results_eq(
  $$select title from public.tasks
    where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'$$,
  array['Other user task'],
  'the other project owner can read a task in their project'
);
select extensions.results_eq(
  $$update public.tasks set title = 'Updated other task'
    where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
    returning title$$,
  array['Updated other task'],
  'the other project owner can update a task in their project'
);
select extensions.is_empty(
  $$select id from public.tasks
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'$$,
  'the other user cannot read the owner task'
);
select extensions.is_empty(
  $$update public.tasks set title = 'Unauthorized update'
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    returning id$$,
  'the other user cannot update the owner task'
);

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select extensions.ok(
  exists (
    select 1
    from public.tasks
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and title = 'Updated owner task'
  ),
  'the denied update left the owner task unchanged'
);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select extensions.is_empty(
  $$delete from public.tasks
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    returning id$$,
  'the other user cannot delete the owner task'
);
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select extensions.ok(
  exists (
    select 1
    from public.tasks
    where id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
      and title = 'Updated owner task'
  ),
  'the denied delete left the owner task unchanged'
);
select extensions.results_eq(
  $$delete from public.tasks
    where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
    returning title$$,
  array['New owner task'],
  'the owner can delete a task in their project'
);
set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select extensions.results_eq(
  $$delete from public.tasks
    where id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
    returning title$$,
  array['Updated other task'],
  'the other project owner can delete a task in their project'
);

select * from extensions.finish();
rollback;
