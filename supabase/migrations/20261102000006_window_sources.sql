-- Sourced planting windows + safe catalogue upgrades.
--  * Each planting window can name the reference it comes from (an id from
--    src/data/crop-sources.ts) and the passage it relies on.
--  * A crop with documented windows may still leave difficulty/sun/water
--    empty when the reference does not cover them, so the earlier
--    "complete fields" rule is dropped: empty means "not documented", and
--    the UI says so.
--  * crops.updated_by marks admin edits. The generated seed only upgrades a
--    crop (incomplete → preliminary, windows) while updated_by is null, so an
--    administrator's work is never overwritten.

alter table public.crop_planting_windows
  add column if not exists source_id text check (source_id ~ '^[a-z0-9-]{2,60}$'),
  add column if not exists source_detail text check (char_length(source_detail) <= 600);

alter table public.crops drop constraint if exists crops_complete_fields;
