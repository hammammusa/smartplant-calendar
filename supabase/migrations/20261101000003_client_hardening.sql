-- Static (GitHub Pages) build: the browser talks to Supabase directly, so every
-- limit the old Server Actions enforced must also hold in the database.
-- RLS already restricts rows to their owner; these constraints keep the data valid
-- even if someone calls the REST API without going through the app.

alter table public.plantings
  add constraint plantings_crop_slug_format check (crop_slug ~ '^[a-z0-9-]{2,60}$'),
  add constraint plantings_crop_name_length check (char_length(crop_name) between 1 and 80),
  add constraint plantings_harvest_order check (
    expected_harvest_start is null or expected_harvest_end is null or expected_harvest_start <= expected_harvest_end
  );

alter table public.tasks
  add constraint tasks_template_key_length check (template_key is null or char_length(template_key) <= 80),
  add constraint tasks_postponed_reasonable check (postponed_count <= 1000);

alter table public.gardens
  add constraint gardens_name_not_blank check (btrim(name) <> '');

-- Cap rows per user to limit abuse of the public API (generous for real use).
create or replace function public.enforce_user_row_limits()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
  max_rows int;
begin
  max_rows := case tg_table_name when 'tasks' then 20000 when 'plantings' then 500 else 100 end;
  execute format('select count(*) from public.%I where user_id = $1', tg_table_name) into n using new.user_id;
  if n >= max_rows then
    raise exception 'row limit reached for %', tg_table_name using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger gardens_row_limit before insert on public.gardens for each row execute function public.enforce_user_row_limits();
create trigger plantings_row_limit before insert on public.plantings for each row execute function public.enforce_user_row_limits();
create trigger tasks_row_limit before insert on public.tasks for each row execute function public.enforce_user_row_limits();
