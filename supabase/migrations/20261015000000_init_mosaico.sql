-- Mosaico: fotos enviadas, favoritos e bucket de armazenamento.
-- Segurança: RLS ligada em tudo; cada pessoa só altera o que é dela.

create table public.photos (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 120),
  category     text,
  storage_path text not null,
  width        integer check (width > 0),
  height       integer check (height > 0),
  is_public    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index photos_owner_idx on public.photos (owner_id);
create index photos_public_recent_idx on public.photos (created_at desc) where is_public;

alter table public.photos enable row level security;

create policy "photos: ver públicas ou próprias"
  on public.photos for select
  using (is_public or owner_id = (select auth.uid()));

create policy "photos: inserir como dono"
  on public.photos for insert to authenticated
  with check (owner_id = (select auth.uid()));

create policy "photos: editar as próprias"
  on public.photos for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "photos: excluir as próprias"
  on public.photos for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Favoritos guardam um "snapshot" da foto, pois fotos do Pexels não existem no nosso banco.
create table public.favorites (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  photo_key  text not null,
  photo      jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, photo_key)
);

alter table public.favorites enable row level security;

create policy "favorites: acesso apenas do dono"
  on public.favorites for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Storage: leitura pública; escrita só dentro da pasta com o id da própria pessoa.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "storage photos: upload na própria pasta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "storage photos: excluir na própria pasta"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
