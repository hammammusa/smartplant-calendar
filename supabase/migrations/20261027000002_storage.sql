-- Public bucket for crop images. Anyone can read; only admins can write.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crop-images', 'crop-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "crop images public read" on storage.objects for select
  using (bucket_id = 'crop-images');

create policy "crop images admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'crop-images' and public.is_admin());

create policy "crop images admin update" on storage.objects for update to authenticated
  using (bucket_id = 'crop-images' and public.is_admin())
  with check (bucket_id = 'crop-images' and public.is_admin());

create policy "crop images admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'crop-images' and public.is_admin());
