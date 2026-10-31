-- RLS / permission tests. Each block raises an exception on failure.
\set ON_ERROR_STOP on

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.com', '{"full_name":"مستخدم أ"}'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.com', '{"full_name":"مستخدم ب"}'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@example.com', '{"full_name":"المشرف"}');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000ad';

-- Profiles and preferences are created automatically.
do $$ begin
  if (select count(*) from public.profiles) <> 3 then raise exception 'profiles not created'; end if;
  if (select count(*) from public.notification_preferences) <> 3 then raise exception 'prefs not created'; end if;
  if (select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a') <> 'مستخدم أ' then raise exception 'name not copied'; end if;
end $$;

-- ---------- user A creates a plan through the RPC ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);

select public.create_plan(jsonb_build_object(
  'garden', jsonb_build_object('name','حديقتي','space_type','home_garden','region_id','ps-hebron','zone','highland'),
  'planting', jsonb_build_object('crop_slug','tomato','crop_name','البندورة','planted_on','2026-04-15','method','transplanting'),
  'tasks', jsonb_build_array(
    jsonb_build_object('type','planting','title','شتل','due_date','2026-04-15','template_key','plant'),
    jsonb_build_object('type','irrigation','title','ري','due_date','2026-04-17','template_key','water#2')
  )
));

do $$ begin
  if (select count(*) from public.tasks) <> 2 then raise exception 'A should see 2 tasks'; end if;
  if (select crop_id from public.plantings limit 1) is null then raise exception 'crop_id not resolved from slug'; end if;
end $$;

-- A can complete a task; completed_at is set automatically.
update public.tasks set status = 'done' where template_key = 'plant';
do $$ begin
  if (select completed_at from public.tasks where template_key = 'plant') is null then raise exception 'completed_at not set'; end if;
end $$;

-- A cannot promote themselves to admin (column privilege).
do $$ begin
  begin
    update public.profiles set role = 'admin' where id = auth.uid();
    raise exception 'role update should fail';
  exception when insufficient_privilege then null;
  end;
end $$;

-- A can update allowed profile columns.
update public.profiles set full_name = 'اسم جديد', region_id = 'ps-gaza' where id = auth.uid();

-- A is not admin: cannot edit crops, cannot read stats.
do $$ begin
  update public.crops set name = 'تخريب' where slug = 'tomato';
  if (select name from public.crops where slug = 'tomato') <> 'البندورة' then raise exception 'non-admin edited crop'; end if;
  begin
    perform public.admin_stats();
    raise exception 'stats should be forbidden';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Constraints added for the static build reject malformed rows from direct API calls.
do $$ begin
  begin
    insert into public.gardens (name, space_type, zone) values ('   ', 'balcony', 'coastal');
    raise exception 'blank garden name accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.create_plan(jsonb_build_object(
      'garden', jsonb_build_object('name','x','space_type','balcony','zone','coastal'),
      'planting', jsonb_build_object('crop_slug','Bad Slug!','crop_name','x','planted_on','2026-04-15'),
      'tasks', '[]'::jsonb));
    raise exception 'invalid crop slug accepted';
  exception when check_violation then null;
  end;
end $$;

-- ---------- user B must not see or touch A's data ----------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
do $$
declare a_task uuid; a_planting uuid; a_garden uuid;
begin
  if (select count(*) from public.tasks) <> 0 then raise exception 'B sees A tasks'; end if;
  if (select count(*) from public.plantings) <> 0 then raise exception 'B sees A plantings'; end if;
  if (select count(*) from public.gardens) <> 0 then raise exception 'B sees A gardens'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'B sees other profiles'; end if;

  update public.tasks set title = 'hacked';
  delete from public.tasks;

  -- B cannot attach a task to A's planting even if the id is known.
  reset role;
  select id, garden_id into a_planting, a_garden from public.plantings limit 1;
  set role authenticated;
  begin
    insert into public.tasks (type, title, due_date, planting_id) values ('custom', 'x', '2026-05-01', a_planting);
    raise exception 'B attached a task to A planting';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.tasks (user_id, type, title, due_date) values ('00000000-0000-0000-0000-00000000000a', 'custom', 'x', '2026-05-01');
    raise exception 'B inserted a task for A';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.create_plan(jsonb_build_object(
      'garden', jsonb_build_object('id', a_garden),
      'planting', jsonb_build_object('crop_slug','tomato','crop_name','x','planted_on','2026-04-15'),
      'tasks', '[]'::jsonb));
    raise exception 'B used A garden';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
do $$ begin
  if (select count(*) from public.tasks where title = 'hacked') <> 0 then raise exception 'B modified A tasks'; end if;
  if (select count(*) from public.tasks) <> 2 then raise exception 'B deleted A tasks'; end if;
end $$;

-- ---------- anonymous visitors ----------
set role anon;
select set_config('request.jwt.claim.sub', '', false);
do $$ begin
  if (select count(*) from public.crops) < 12 then raise exception 'anon cannot read crops'; end if;
  if (select count(*) from public.crop_guides) = 0 then raise exception 'anon cannot read guides'; end if;
  begin
    perform count(*) from public.tasks;
    raise exception 'anon read tasks';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.create_plan('{}'::jsonb);
    raise exception 'anon called create_plan';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Unpublished crops are hidden from the public.
reset role;
update public.crops set is_published = false where slug = 'grape';
set role anon;
do $$ begin
  if exists (select 1 from public.crops where slug = 'grape') then raise exception 'unpublished crop visible'; end if;
  if exists (select 1 from public.crop_guides g join public.crops c on c.id = g.crop_id where c.slug = 'grape') then raise exception 'unpublished guides visible'; end if;
end $$;

-- ---------- admin ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000ad', false);
do $$
declare s jsonb;
begin
  if not exists (select 1 from public.crops where slug = 'grape') then raise exception 'admin cannot see unpublished crop'; end if;
  update public.crops set name = 'العنب' where slug = 'grape';
  insert into public.faqs (question, answer) values ('سؤال تجريبي؟', 'إجابة تجريبية');
  update public.site_settings set value = '{"frostTempC":3,"heatTempC":36,"rainProbabilityPct":60,"heavyRainMm":20,"strongWindKmh":40}' where key = 'weather_thresholds';
  s := public.admin_stats();
  if (s ->> 'users')::int <> 3 then raise exception 'stats users wrong: %', s; end if;
  if (s ->> 'tasks')::int <> 2 then raise exception 'stats tasks wrong: %', s; end if;
  -- Admin still cannot read other users' private tasks directly.
  if (select count(*) from public.tasks) <> 0 then raise exception 'admin reads private tasks'; end if;
end $$;

reset role;
select 'ALL RLS TESTS PASSED' as result;
