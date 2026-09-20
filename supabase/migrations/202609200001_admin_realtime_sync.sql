-- One shared RetailOS state for the authenticated administrator.

create table if not exists public.retailos_states (
  store_key text primary key check (store_key = 'primary'),
  data jsonb not null,
  revision bigint not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.retailos_states enable row level security;

drop policy if exists "authenticated admin can read state" on public.retailos_states;
create policy "authenticated admin can read state"
  on public.retailos_states for select
  to authenticated
  using (true);

-- Writes go through the revision-checked function below so two open devices
-- cannot silently overwrite one another.

create or replace function public.retailos_initialize_state(p_data jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  insert into public.retailos_states(store_key, data, updated_by)
  values ('primary', p_data, auth.uid())
  on conflict (store_key) do nothing;
end;
$$;

create or replace function public.retailos_save_state(
  p_expected_revision bigint,
  p_data jsonb
) returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_revision bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select revision into v_revision
  from public.retailos_states
  where store_key = 'primary'
  for update;

  if v_revision is distinct from p_expected_revision then
    return -1;
  end if;

  update public.retailos_states
  set data = p_data,
      revision = revision + 1,
      updated_at = now(),
      updated_by = auth.uid()
  where store_key = 'primary'
  returning revision into v_revision;

  return v_revision;
end;
$$;

revoke all on function public.retailos_initialize_state(jsonb) from public;
revoke all on function public.retailos_save_state(bigint, jsonb) from public;
grant execute on function public.retailos_initialize_state(jsonb) to authenticated;
grant execute on function public.retailos_save_state(bigint, jsonb) to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'retailos_states'
  ) then
    alter publication supabase_realtime add table public.retailos_states;
  end if;
end $$;
