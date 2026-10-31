-- SmartPlant Calendar — initial schema
-- Security model:
--   * Every user-owned row carries user_id and is protected by RLS (owner only).
--   * Public reference content (crops, guides, regions, FAQs, settings) is
--     readable by everyone and writable only by admins (is_admin()).
--   * Roles/plan tiers cannot be changed by users: column privileges exclude them.
--   * Admin statistics are exposed only through an aggregate-only function.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

create table public.countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name text not null,
  sort_order int not null default 0
);

create table public.regions (
  id text primary key check (id ~ '^[a-z]{2}-[a-z0-9-]{2,40}$'),
  country_code text not null references public.countries(code) on delete cascade,
  name text not null,
  zone text not null check (zone in ('coastal','highland','inland_plain','jordan_valley','arid')),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  timezone text not null default 'Asia/Hebron',
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------------
-- Profiles & roles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 80),
  role text not null default 'user' check (role in ('user','admin')),
  -- Prepared for future SaaS tiers; the core product never depends on it.
  plan_tier text not null default 'free' check (plan_tier in ('free','premium','organization')),
  region_id text references public.regions(id) on delete set null,
  zone text check (zone in ('coastal','highland','inland_plain','jordan_valley','arid')),
  timezone text not null default 'Asia/Hebron' check (char_length(timezone) <= 64),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  in_app_enabled boolean not null default true,
  -- External channels stay disabled until a real provider is configured.
  email_enabled boolean not null default false,
  push_enabled boolean not null default false,
  reminder_days_before int not null default 1 check (reminder_days_before between 0 and 14),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Crop catalogue (admin-managed)
-- ---------------------------------------------------------------------------

create table public.crops (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  name text not null check (char_length(name) between 2 and 60),
  other_names text[] not null default '{}',
  scientific_name text,
  category text not null check (category in ('fruiting_vegetable','leafy_vegetable','root_tuber','bulb','herb','fruit','tree')),
  life_cycle text not null check (life_cycle in ('annual','perennial')),
  difficulty text not null check (difficulty in ('easy','medium','hard')),
  sun text not null check (sun in ('full_sun','partial_sun','shade_tolerant')),
  water text not null check (water in ('low','moderate','high')),
  space_types text[] not null default '{}',
  growth_days_min int check (growth_days_min between 1 and 3650),
  growth_days_max int check (growth_days_max between 1 and 3650),
  growth_note text,
  summary text not null,
  watering_summary text,
  image_url text,
  image_alt text,
  data_status text not null default 'preliminary' check (data_status in ('preliminary','reviewed')),
  source_note text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint growth_range check (
    (growth_days_min is null and growth_days_max is null)
    or (growth_days_min is not null and growth_days_max is not null and growth_days_min <= growth_days_max)
  ),
  constraint space_types_valid check (
    space_types <@ array['home_garden','rooftop','balcony','containers','small_plot','farm']::text[]
  )
);

create table public.crop_planting_windows (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references public.crops(id) on delete cascade,
  zone text not null check (zone in ('coastal','highland','inland_plain','jordan_valley','arid')),
  start_month int not null check (start_month between 1 and 12),
  end_month int not null check (end_month between 1 and 12),
  method text not null check (method in ('direct_sowing','transplanting','tubers','cloves','cuttings','saplings')),
  note text,
  sort_order int not null default 0
);
create index on public.crop_planting_windows (crop_id);

create table public.crop_task_templates (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references public.crops(id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9-]{1,40}$'),
  type text not null check (type in ('soil_prep','planting','irrigation','fertilizing','care','pest_check','harvest','custom')),
  title text not null,
  description text not null default '',
  offset_days int not null check (offset_days between -365 and 3650),
  repeat_every_days int check (repeat_every_days between 1 and 365),
  until_offset_days int check (until_offset_days between -365 and 3650),
  active_months int[] not null default '{}',
  sort_order int not null default 0,
  unique (crop_id, key)
);
create index on public.crop_task_templates (crop_id);

create table public.crop_guides (
  id uuid primary key default gen_random_uuid(),
  crop_id uuid not null references public.crops(id) on delete cascade,
  section text not null check (section in ('overview','planting','care','irrigation','fertilization','harvest','problems')),
  title text not null,
  body text not null,
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);
create index on public.crop_guides (crop_id);

-- ---------------------------------------------------------------------------
-- User data
-- ---------------------------------------------------------------------------

create table public.gardens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  space_type text not null check (space_type in ('home_garden','rooftop','balcony','containers','small_plot','farm')),
  region_id text references public.regions(id) on delete set null,
  zone text not null check (zone in ('coastal','highland','inland_plain','jordan_valley','arid')),
  area_m2 numeric check (area_m2 >= 0 and area_m2 <= 1000000),
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  created_at timestamptz not null default now()
);
create index on public.gardens (user_id);

create table public.plantings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  garden_id uuid not null references public.gardens(id) on delete cascade,
  crop_id uuid references public.crops(id) on delete set null,
  -- Snapshot so the planting stays readable if the crop is later removed.
  crop_slug text not null,
  crop_name text not null,
  planted_on date not null,
  method text check (method in ('direct_sowing','transplanting','tubers','cloves','cuttings','saplings')),
  area_m2 numeric check (area_m2 >= 0 and area_m2 <= 1000000),
  quantity int check (quantity >= 0 and quantity <= 100000),
  status text not null default 'active' check (status in ('active','harvested','archived')),
  expected_harvest_start date,
  expected_harvest_end date,
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.plantings (user_id);
create index on public.plantings (garden_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  planting_id uuid references public.plantings(id) on delete cascade,
  garden_id uuid references public.gardens(id) on delete cascade,
  type text not null check (type in ('soil_prep','planting','irrigation','fertilizing','care','pest_check','harvest','custom')),
  title text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 1000),
  due_date date not null,
  status text not null default 'pending' check (status in ('pending','done','skipped')),
  completed_at timestamptz,
  postponed_count int not null default 0 check (postponed_count >= 0),
  source text not null default 'custom' check (source in ('generated','custom')),
  template_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.tasks (user_id, due_date);
create index on public.tasks (planting_id);

-- ---------------------------------------------------------------------------
-- Content & settings
-- ---------------------------------------------------------------------------

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key check (key ~ '^[a-z_]{2,40}$'),
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger crops_touch before update on public.crops for each row execute function public.touch_updated_at();
create trigger plantings_touch before update on public.plantings for each row execute function public.touch_updated_at();
create trigger tasks_touch before update on public.tasks for each row execute function public.touch_updated_at();
create trigger guides_touch before update on public.crop_guides for each row execute function public.touch_updated_at();
create trigger faqs_touch before update on public.faqs for each row execute function public.touch_updated_at();
create trigger prefs_touch before update on public.notification_preferences for each row execute function public.touch_updated_at();

-- Keep completed_at consistent with status.
create or replace function public.tasks_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status is distinct from 'done') then
    new.completed_at = coalesce(new.completed_at, now());
  elsif new.status <> 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;
create trigger tasks_completed before insert or update on public.tasks for each row execute function public.tasks_completed_at();

-- Create a profile and default preferences for each new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80));
  insert into public.notification_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.countries enable row level security;
alter table public.regions enable row level security;
alter table public.profiles enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.crops enable row level security;
alter table public.crop_planting_windows enable row level security;
alter table public.crop_task_templates enable row level security;
alter table public.crop_guides enable row level security;
alter table public.gardens enable row level security;
alter table public.plantings enable row level security;
alter table public.tasks enable row level security;
alter table public.faqs enable row level security;
alter table public.site_settings enable row level security;

-- Reference data: public read, admin write.
create policy "countries readable" on public.countries for select using (true);
create policy "countries admin write" on public.countries for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "regions readable" on public.regions for select using (true);
create policy "regions admin write" on public.regions for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Crops: published rows are public; admins see and edit everything.
create policy "crops readable" on public.crops for select using (is_published or public.is_admin());
create policy "crops admin write" on public.crops for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "windows readable" on public.crop_planting_windows for select
  using (exists (select 1 from public.crops c where c.id = crop_id and (c.is_published or public.is_admin())));
create policy "windows admin write" on public.crop_planting_windows for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "templates readable" on public.crop_task_templates for select
  using (exists (select 1 from public.crops c where c.id = crop_id and (c.is_published or public.is_admin())));
create policy "templates admin write" on public.crop_task_templates for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "guides readable" on public.crop_guides for select
  using (exists (select 1 from public.crops c where c.id = crop_id and (c.is_published or public.is_admin())));
create policy "guides admin write" on public.crop_guides for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "faqs readable" on public.faqs for select using (is_published or public.is_admin());
create policy "faqs admin write" on public.faqs for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "settings readable" on public.site_settings for select using (true);
create policy "settings admin write" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Profiles: users see and edit only their own row (role is not updatable, see grants).
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "own prefs read" on public.notification_preferences for select to authenticated using (user_id = auth.uid());
create policy "own prefs update" on public.notification_preferences for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Gardens / plantings / tasks: owner only, and references must belong to the owner too.
create policy "own gardens" on public.gardens for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "own plantings" on public.plantings for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.gardens g where g.id = garden_id and g.user_id = auth.uid())
  );

create policy "own tasks" on public.tasks for all to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (planting_id is null or exists (select 1 from public.plantings p where p.id = planting_id and p.user_id = auth.uid()))
    and (garden_id is null or exists (select 1 from public.gardens g where g.id = garden_id and g.user_id = auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- Grants (defence in depth on top of RLS)
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

grant select on public.countries, public.regions, public.crops, public.crop_planting_windows,
  public.crop_task_templates, public.crop_guides, public.faqs, public.site_settings to anon, authenticated;

grant insert, update, delete on public.countries, public.regions, public.crops, public.crop_planting_windows,
  public.crop_task_templates, public.crop_guides, public.faqs, public.site_settings to authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, region_id, zone, timezone, latitude, longitude) on public.profiles to authenticated;

grant select on public.notification_preferences to authenticated;
grant update (in_app_enabled, reminder_days_before) on public.notification_preferences to authenticated;

grant select, insert, update, delete on public.gardens, public.plantings, public.tasks to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: create a plan atomically (runs with the caller's rights, so RLS applies)
-- ---------------------------------------------------------------------------

create or replace function public.create_plan(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_garden_id uuid;
  v_planting_id uuid;
  v_garden jsonb := payload -> 'garden';
  v_planting jsonb := payload -> 'planting';
  v_count int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  v_count := coalesce(jsonb_array_length(payload -> 'tasks'), 0);
  if v_count > 500 then
    raise exception 'too many tasks' using errcode = '22023';
  end if;

  if v_garden ? 'id' and nullif(v_garden ->> 'id', '') is not null then
    v_garden_id := (v_garden ->> 'id')::uuid;
    if not exists (select 1 from public.gardens g where g.id = v_garden_id and g.user_id = auth.uid()) then
      raise exception 'garden not found' using errcode = '42501';
    end if;
  else
    insert into public.gardens (user_id, name, space_type, region_id, zone, area_m2, latitude, longitude)
    values (
      auth.uid(),
      v_garden ->> 'name',
      v_garden ->> 'space_type',
      nullif(v_garden ->> 'region_id', ''),
      v_garden ->> 'zone',
      (v_garden ->> 'area_m2')::numeric,
      (v_garden ->> 'latitude')::double precision,
      (v_garden ->> 'longitude')::double precision
    )
    returning id into v_garden_id;
  end if;

  insert into public.plantings (user_id, garden_id, crop_id, crop_slug, crop_name, planted_on, method, area_m2,
    quantity, status, expected_harvest_start, expected_harvest_end, notes)
  values (
    auth.uid(),
    v_garden_id,
    (select c.id from public.crops c where c.slug = v_planting ->> 'crop_slug'),
    v_planting ->> 'crop_slug',
    v_planting ->> 'crop_name',
    (v_planting ->> 'planted_on')::date,
    nullif(v_planting ->> 'method', ''),
    (v_planting ->> 'area_m2')::numeric,
    (v_planting ->> 'quantity')::int,
    coalesce(nullif(v_planting ->> 'status', ''), 'active'),
    (v_planting ->> 'expected_harvest_start')::date,
    (v_planting ->> 'expected_harvest_end')::date,
    nullif(v_planting ->> 'notes', '')
  )
  returning id into v_planting_id;

  insert into public.tasks (user_id, planting_id, garden_id, type, title, description, due_date, status,
    postponed_count, source, template_key)
  select
    auth.uid(),
    v_planting_id,
    v_garden_id,
    t ->> 'type',
    t ->> 'title',
    nullif(t ->> 'description', ''),
    (t ->> 'due_date')::date,
    coalesce(nullif(t ->> 'status', ''), 'pending'),
    coalesce((t ->> 'postponed_count')::int, 0),
    coalesce(nullif(t ->> 'source', ''), 'generated'),
    nullif(t ->> 'template_key', '')
  from jsonb_array_elements(coalesce(payload -> 'tasks', '[]'::jsonb)) as t;

  return v_planting_id;
end;
$$;

revoke all on function public.create_plan(jsonb) from public, anon;
grant execute on function public.create_plan(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: aggregate statistics for admins (no personal data is returned)
-- ---------------------------------------------------------------------------

create or replace function public.admin_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'users', (select count(*) from public.profiles),
    'users_last_30_days', (select count(*) from public.profiles where created_at > now() - interval '30 days'),
    'gardens', (select count(*) from public.gardens),
    'plantings', (select count(*) from public.plantings),
    'active_plantings', (select count(*) from public.plantings where status = 'active'),
    'tasks', (select count(*) from public.tasks),
    'tasks_done', (select count(*) from public.tasks where status = 'done'),
    'top_crops', coalesce((
      select jsonb_agg(row_to_json(x)) from (
        select crop_name as name, count(*) as count
        from public.plantings group by crop_name order by count(*) desc limit 5
      ) x
    ), '[]'::jsonb),
    'zones', coalesce((
      select jsonb_agg(row_to_json(z)) from (
        select zone, count(*) as count from public.gardens group by zone order by count(*) desc
      ) z
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.admin_stats() from public, anon;
grant execute on function public.admin_stats() to authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
