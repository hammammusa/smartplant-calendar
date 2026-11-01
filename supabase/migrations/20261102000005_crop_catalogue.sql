-- Crop catalogue expansion (phase 2).
--  * "incomplete" crops: listed by name so farmers can find them, but with no
--    documented planting data yet. Only these may leave difficulty, sun and
--    water empty — nothing is guessed to fill the columns.
--  * New categories (legumes, cereals, forage, field crops).
--  * New planting methods. Sowing in a nursery and moving seedlings to the
--    field are separate methods so their dates are never merged.
--  * propagation: the usual ways a crop is established (general knowledge).

alter table public.crops alter column difficulty drop not null;
alter table public.crops alter column sun drop not null;
alter table public.crops alter column water drop not null;

alter table public.crops drop constraint if exists crops_category_check;
alter table public.crops add constraint crops_category_check check (category in (
  'fruiting_vegetable','leafy_vegetable','root_tuber','bulb','herb','fruit','tree',
  'legume','cereal','forage','field_crop'
));

alter table public.crops drop constraint if exists crops_data_status_check;
alter table public.crops add constraint crops_data_status_check
  check (data_status in ('preliminary','reviewed','incomplete'));

alter table public.crops drop constraint if exists crops_complete_fields;
alter table public.crops add constraint crops_complete_fields check (
  data_status = 'incomplete' or (difficulty is not null and sun is not null and water is not null)
);

alter table public.crops add column if not exists propagation text[] not null default '{}';
alter table public.crops drop constraint if exists crops_propagation_valid;
alter table public.crops add constraint crops_propagation_valid check (
  propagation <@ array['direct_sowing','transplanting','tubers','cloves','cuttings','saplings','nursery_sowing','offshoots']::text[]
);

alter table public.crop_planting_windows drop constraint if exists crop_planting_windows_method_check;
alter table public.crop_planting_windows add constraint crop_planting_windows_method_check check (
  method in ('direct_sowing','transplanting','tubers','cloves','cuttings','saplings','nursery_sowing','offshoots')
);

alter table public.plantings drop constraint if exists plantings_method_check;
alter table public.plantings add constraint plantings_method_check check (
  method in ('direct_sowing','transplanting','tubers','cloves','cuttings','saplings','nursery_sowing','offshoots')
);

-- Search aliases are capped so a single row stays small.
alter table public.crops drop constraint if exists crops_other_names_limit;
alter table public.crops add constraint crops_other_names_limit check (cardinality(other_names) <= 12);
