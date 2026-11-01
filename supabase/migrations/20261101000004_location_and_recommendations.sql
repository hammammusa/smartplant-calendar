-- Precise location + "what to plant now" recommendations.

-- 1. Greenhouse as a space type (no dedicated crop rules yet; the UI says so).
alter table public.gardens drop constraint if exists gardens_space_type_check;
alter table public.gardens add constraint gardens_space_type_check
  check (space_type in ('home_garden','rooftop','balcony','containers','small_plot','farm','greenhouse'));

alter table public.crops drop constraint if exists space_types_valid;
alter table public.crops add constraint space_types_valid
  check (space_types <@ array['home_garden','rooftop','balcony','containers','small_plot','farm','greenhouse']::text[]);

-- 2. Frost sensitivity drives frost warnings in recommendations (admin-editable).
alter table public.crops add column if not exists frost_sensitive boolean not null default false;
update public.crops set frost_sensitive = true where slug in ('tomato', 'cucumber', 'pepper', 'potato');

-- 3. The user's confirmed location. Stored only on the user's own profile row
--    (RLS: owner-only). Coordinates are never exposed to other users or admins
--    (admin_stats returns aggregates only).
alter table public.profiles
  add column if not exists location_label text check (char_length(location_label) <= 160),
  add column if not exists location_source text check (location_source in ('gps','map','search','list')),
  add column if not exists location_accuracy_m numeric check (location_accuracy_m >= 0 and location_accuracy_m <= 1000000),
  add column if not exists elevation_m numeric check (elevation_m between -500 and 9000),
  add column if not exists external_geo_consent boolean not null default false,
  add column if not exists location_confirmed_at timestamptz;

grant update (location_label, location_source, location_accuracy_m, elevation_m, external_geo_consent, location_confirmed_at)
  on public.profiles to authenticated;
