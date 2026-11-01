-- Scope of planting windows.
--  * zone may be null: a general date for the whole country, documented by a
--    national source but not for any particular climate zone. The app uses it
--    only when the crop has no window for the visitor's zone, and labels it as
--    general (never as a firm recommendation for that zone).
--  * country_code: the country the source covers (ISO, e.g. 'PS'). A scoped
--    window is not shown as documented for locations in other countries.
--    Existing rows keep country_code null (general Levant guidance).

alter table public.crop_planting_windows alter column zone drop not null;
alter table public.crop_planting_windows
  add column if not exists country_code text check (country_code ~ '^[A-Z]{2}$');
