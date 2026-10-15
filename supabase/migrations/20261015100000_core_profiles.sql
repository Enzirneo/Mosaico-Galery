-- ============================================================================
-- MÓDULO CORE: pessoas e relações entre pessoas. Reutilizável em qualquer app.
-- Convenção: as tabelas nascem fechadas (sem grants). Cada acesso é liberado
-- explicitamente aqui, e as regras de linha (RLS) decidem quem vê o quê.
-- ============================================================================

create type public.privacy as enum ('private', 'unlisted', 'public');

-- profiles ------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_path  text,
  bio          text check (char_length(bio) <= 280),
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: leitura pública"
  on public.profiles for select to anon, authenticated
  using (true);

create policy "profiles: editar o próprio"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update (username, display_name, avatar_path, bio) on public.profiles to authenticated;

-- Todo cadastro novo ganha um perfil automaticamente.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(new.raw_user_meta_data ->> 'name', 60));
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- follows -------------------------------------------------------------------
create table public.follows (
  follower_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  followed_id uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create index follows_followed_idx on public.follows (followed_id);

alter table public.follows enable row level security;

create policy "follows: leitura pública"
  on public.follows for select to anon, authenticated
  using (true);

create policy "follows: seguir como si mesmo"
  on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid()));

create policy "follows: deixar de seguir"
  on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));

revoke all on public.follows from anon, authenticated;
grant select on public.follows to anon, authenticated;
grant insert (followed_id), delete on public.follows to authenticated;
