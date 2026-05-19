create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  fasting_plan text,
  fasting_hours_goal integer,
  eating_hours_goal integer,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.fasting_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  shared_fast_id uuid,
  start_time timestamp with time zone default now() not null,
  end_time timestamp with time zone,
  duration_minutes integer,
  status text check (status in ('active', 'completed')) default 'active' not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.shared_fasts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  title text default 'Fast together' not null,
  start_time timestamp with time zone not null,
  fasting_hours_goal integer default 16 not null check (fasting_hours_goal between 1 and 168),
  status text check (status in ('planned', 'active', 'completed', 'canceled')) default 'planned' not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.shared_fast_participants (
  id uuid primary key default gen_random_uuid(),
  shared_fast_id uuid references public.shared_fasts(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner', 'member')) default 'member' not null,
  status text check (status in ('joined', 'left')) default 'joined' not null,
  joined_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.shared_fast_invites (
  id uuid primary key default gen_random_uuid(),
  shared_fast_id uuid references public.shared_fasts(id) on delete cascade not null,
  invited_email text,
  token uuid default gen_random_uuid() not null unique,
  created_by uuid references auth.users(id) on delete cascade not null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

alter table public.fasting_sessions
  add column if not exists shared_fast_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fasting_sessions_shared_fast_id_fkey'
  ) then
    alter table public.fasting_sessions
      add constraint fasting_sessions_shared_fast_id_fkey
      foreign key (shared_fast_id) references public.shared_fasts(id) on delete set null;
  end if;
end;
$$;

create table if not exists public.weight_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  weight numeric(6, 2) not null check (weight > 0),
  unit text default 'lb' not null check (unit in ('lb', 'kg')),
  measured_at timestamp with time zone default now() not null,
  created_at timestamp with time zone default now() not null
);

create unique index if not exists one_active_fast_per_user
  on public.fasting_sessions(user_id)
  where status = 'active';

create unique index if not exists one_shared_fast_participant_per_user
  on public.shared_fast_participants(shared_fast_id, user_id)
  where user_id is not null;

alter table public.profiles enable row level security;
alter table public.shared_fasts enable row level security;
alter table public.shared_fast_participants enable row level security;
alter table public.shared_fast_invites enable row level security;
alter table public.fasting_sessions enable row level security;
alter table public.weight_measurements enable row level security;

create or replace function public.is_shared_fast_member(
  fast_id uuid,
  member_id uuid
)
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.shared_fast_participants participants
    where participants.shared_fast_id = fast_id
      and participants.user_id = member_id
      and participants.status = 'joined'
  )
  or exists (
    select 1
    from public.shared_fasts shared_fast
    where shared_fast.id = fast_id
      and shared_fast.owner_id = member_id
  );
$$;

drop policy if exists "Users can read own profile" on public.profiles;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can read shared fasts they joined" on public.shared_fasts;

create policy "Users can read shared fasts they joined"
  on public.shared_fasts for select
  using (public.is_shared_fast_member(shared_fasts.id, auth.uid()));

drop policy if exists "Users can create shared fasts" on public.shared_fasts;

create policy "Users can create shared fasts"
  on public.shared_fasts for insert
  with check (auth.uid() = owner_id);

drop policy if exists "Owners can update shared fasts" on public.shared_fasts;

create policy "Owners can update shared fasts"
  on public.shared_fasts for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Shared fast members can read participants" on public.shared_fast_participants;

create policy "Shared fast members can read participants"
  on public.shared_fast_participants for select
  using (public.is_shared_fast_member(shared_fast_id, auth.uid()));

drop policy if exists "Owners can add shared fast participants" on public.shared_fast_participants;

create policy "Owners can add shared fast participants"
  on public.shared_fast_participants for insert
  with check (
    user_id = auth.uid()
    or exists (
      select 1
      from public.shared_fasts shared_fast
      where shared_fast.id = shared_fast_participants.shared_fast_id
        and shared_fast.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can update own shared fast participation" on public.shared_fast_participants;

create policy "Users can update own shared fast participation"
  on public.shared_fast_participants for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Invite creators can read shared fast invites" on public.shared_fast_invites;

create policy "Invite creators can read shared fast invites"
  on public.shared_fast_invites for select
  using (
    auth.uid() = created_by
    or auth.uid() = accepted_by
  );

drop policy if exists "Owners can create shared fast invites" on public.shared_fast_invites;

create policy "Owners can create shared fast invites"
  on public.shared_fast_invites for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1
      from public.shared_fasts shared_fast
      where shared_fast.id = shared_fast_invites.shared_fast_id
        and shared_fast.owner_id = auth.uid()
    )
  );

drop policy if exists "Users can read own fasting sessions" on public.fasting_sessions;

create policy "Users can read own fasting sessions"
  on public.fasting_sessions for select
  using (
    auth.uid() = user_id
    or public.is_shared_fast_member(shared_fast_id, auth.uid())
  );

drop policy if exists "Users can insert own fasting sessions" on public.fasting_sessions;

create policy "Users can insert own fasting sessions"
  on public.fasting_sessions for insert
  with check (
    auth.uid() = user_id
    and (
      shared_fast_id is null
      or public.is_shared_fast_member(shared_fast_id, auth.uid())
    )
  );

drop policy if exists "Users can update own fasting sessions" on public.fasting_sessions;

create policy "Users can update own fasting sessions"
  on public.fasting_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can read own weight measurements" on public.weight_measurements;

create policy "Users can read own weight measurements"
  on public.weight_measurements for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own weight measurements" on public.weight_measurements;

create policy "Users can insert own weight measurements"
  on public.weight_measurements for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own weight measurements" on public.weight_measurements;

create policy "Users can update own weight measurements"
  on public.weight_measurements for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own weight measurements" on public.weight_measurements;

create policy "Users can delete own weight measurements"
  on public.weight_measurements for delete
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.get_shared_fast_invite(invite_token uuid)
returns table (
  shared_fast_id uuid,
  title text,
  start_time timestamp with time zone,
  fasting_hours_goal integer,
  host_email text,
  invited_email text,
  accepted_at timestamp with time zone
)
language plpgsql
security definer set search_path = public
as $$
declare
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  return query
  select
    shared_fast.id,
    shared_fast.title,
    shared_fast.start_time,
    shared_fast.fasting_hours_goal,
    host.email,
    invite.invited_email,
    invite.accepted_at
  from public.shared_fast_invites invite
  join public.shared_fasts shared_fast on shared_fast.id = invite.shared_fast_id
  left join public.profiles host on host.id = shared_fast.owner_id
  where invite.token = invite_token
    and (
      invite.invited_email is null
      or lower(invite.invited_email) = current_email
      or invite.accepted_by = auth.uid()
    );
end;
$$;

create or replace function public.create_shared_fast(
  fast_title text,
  fast_start_time timestamp with time zone,
  fast_fasting_hours_goal integer,
  invite_emails text[] default array[]::text[]
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  new_shared_fast_id uuid;
  invite_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if fast_fasting_hours_goal < 1 or fast_fasting_hours_goal > 168 then
    raise exception 'Fasting goal must be between 1 and 168 hours.';
  end if;

  insert into public.shared_fasts (
    owner_id,
    title,
    start_time,
    fasting_hours_goal
  )
  values (
    auth.uid(),
    coalesce(nullif(trim(fast_title), ''), 'Fast together'),
    fast_start_time,
    fast_fasting_hours_goal
  )
  returning id into new_shared_fast_id;

  insert into public.shared_fast_participants (
    shared_fast_id,
    user_id,
    role,
    status
  )
  values (
    new_shared_fast_id,
    auth.uid(),
    'owner',
    'joined'
  );

  foreach invite_email in array invite_emails loop
    invite_email := lower(trim(invite_email));

    if invite_email <> '' then
      insert into public.shared_fast_invites (
        shared_fast_id,
        invited_email,
        created_by
      )
      values (
        new_shared_fast_id,
        invite_email,
        auth.uid()
      );
    end if;
  end loop;

  return new_shared_fast_id;
end;
$$;

create or replace function public.accept_shared_fast_invite(invite_token uuid)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  invite_record public.shared_fast_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into invite_record
  from public.shared_fast_invites
  where token = invite_token
    and (
      invited_email is null
      or lower(invited_email) = current_email
      or accepted_by = auth.uid()
    )
  limit 1;

  if invite_record.id is null then
    raise exception 'Invite not found.';
  end if;

  insert into public.shared_fast_participants (
    shared_fast_id,
    user_id,
    role,
    status
  )
  values (
    invite_record.shared_fast_id,
    auth.uid(),
    'member',
    'joined'
  )
  on conflict (shared_fast_id, user_id)
  where user_id is not null
  do update set
    status = 'joined',
    joined_at = now();

  update public.shared_fast_invites
  set
    accepted_by = auth.uid(),
    accepted_at = coalesce(accepted_at, now())
  where id = invite_record.id;

  return invite_record.shared_fast_id;
end;
$$;

grant execute on function public.get_shared_fast_invite(uuid) to authenticated;
grant execute on function public.create_shared_fast(text, timestamp with time zone, integer, text[]) to authenticated;
grant execute on function public.accept_shared_fast_invite(uuid) to authenticated;

notify pgrst, 'reload schema';
