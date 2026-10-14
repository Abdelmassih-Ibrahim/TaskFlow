create extension if not exists pgtap with schema extensions;

begin;
select extensions.plan(23);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'projects-owner@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'projects-other@example.test');

select extensions.policies_are(
  'public',
  'projects',
  array[
    'projects_delete_own',
    'projects_insert_own',
    'projects_select_own',
    'projects_update_own'
  ],
  'projects has one explicit policy per operation'
);
select extensions.ok(
  (select relrowsecurity from pg_catalog.pg_class where oid = 'public.projects'::regclass),
  'RLS is enabled on projects'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.projects', 'select,insert,update,delete'),
  'anon has no project privileges'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.projects', 'select,insert,update,delete'),
  'authenticated has the CRUD grant required by the app'
);

set local role anon;
select extensions.throws_ok(
  $$select * from public.projects$$,
  '42501',
  null,
  'anon cannot read projects'
);
select extensions.throws_ok(
  $$insert into public.projects (owner_id, name)
    values ('11111111-1111-4111-8111-111111111111', 'Anonymous project')$$,
  '42501',
  null,
  'anon cannot insert projects'
);
select extensions.throws_ok(
  $$update public.projects set name = 'Anonymous update'$$,
  '42501',
  null,
  'anon cannot update projects'
);
select extensions.throws_ok(
  $$delete from public.projects$$,
  '42501',
  null,
  'anon cannot delete projects'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select extensions.results_eq(
  $$insert into public.projects (id, owner_id, name)
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      '11111111-1111-4111-8111-111111111111',
      'Owner project'
    )
    returning name$$,
  array['Owner project'],
  'an owner can create a project'
);
select extensions.results_eq(
  $$select name from public.projects
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  array['Owner project'],
  'an owner can read their project'
);
select extensions.results_eq(
  $$update public.projects set name = 'Updated owner project'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    returning name$$,
  array['Updated owner project'],
  'an owner can update their project'
);
select extensions.throws_ok(
  $$update public.projects
    set owner_id = '22222222-2222-4222-8222-222222222222'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  '42501',
  null,
  'an owner cannot transfer a project'
);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select extensions.throws_ok(
  $$insert into public.projects (id, owner_id, name)
    values (
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      '11111111-1111-4111-8111-111111111111',
      'Spoofed project'
    )$$,
  '42501',
  null,
  'a user cannot create a project for another owner'
);
select extensions.results_eq(
  $$insert into public.projects (id, owner_id, name)
    values (
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      '22222222-2222-4222-8222-222222222222',
      'Other user project'
    )
    returning name$$,
  array['Other user project'],
  'the other user can create their own project'
);
select extensions.results_eq(
  $$select name from public.projects
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$,
  array['Other user project'],
  'the other user can read their project'
);
select extensions.results_eq(
  $$update public.projects set name = 'Updated other project'
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    returning name$$,
  array['Updated other project'],
  'the other user can update their project'
);
select extensions.is_empty(
  $$select id from public.projects
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  'the other user cannot read the owner project'
);
select extensions.is_empty(
  $$update public.projects set name = 'Unauthorized update'
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    returning id$$,
  'the other user cannot update the owner project'
);

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select extensions.results_eq(
  $$select name from public.projects
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  array['Updated owner project'],
  'the denied update left the owner project unchanged'
);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
select extensions.is_empty(
  $$delete from public.projects
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    returning id$$,
  'the other user cannot delete the owner project'
);
select extensions.results_eq(
  $$delete from public.projects
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    returning name$$,
  array['Updated other project'],
  'the other user can delete their project'
);

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
select extensions.results_eq(
  $$select name from public.projects
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'$$,
  array['Updated owner project'],
  'the denied delete left the owner project unchanged'
);
select extensions.results_eq(
  $$delete from public.projects
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    returning name$$,
  array['Updated owner project'],
  'the owner can delete their project'
);

select * from extensions.finish();
rollback;
