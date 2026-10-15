-- ============================================================================
-- MÓDULO CORE: conteúdo genérico. Qualquer coisa que alguém cria é um "item".
--   items       o conteúdo (foto, álbum, e no futuro receita, vídeo...)
--   item_links  "este item está dentro daquele" (foto em álbum)
--   reactions   uma pessoa reagiu a um item (favorito hoje, curtida amanhã)
-- Um tipo novo de conteúdo é só um novo valor em `kind`: não exige migração.
-- ============================================================================

create table public.items (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid default auth.uid() references auth.users (id) on delete cascade, -- nulo = item externo (ex.: Pexels)
  kind         text not null check (kind ~ '^[a-z_]{2,30}$'),
  title        text not null check (char_length(title) between 1 and 120),
  description  text check (char_length(description) <= 2000),
  privacy      public.privacy not null default 'private',
  -- Código secreto do link "por link". Para revogar o link, gere outro.
  share_token  text not null unique
               default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  source       text not null default 'upload' check (source ~ '^[a-z_]{3,30}$'),
  external_id  text,
  storage_path text,
  width        integer check (width > 0),
  height       integer check (height > 0),
  tags         text[] not null default '{}' check (cardinality(tags) <= 20),
  metadata     jsonb not null default '{}' check (pg_column_size(metadata) <= 4096),
  created_at   timestamptz not null default now(),
  unique (source, external_id),
  -- Enviado pela pessoa: tem dono. Externo: não tem.
  check ((source = 'upload') = (owner_id is not null)),
  -- Foto enviada precisa ter arquivo.
  check (source <> 'upload' or kind <> 'photo' or storage_path is not null)
);

create index items_owner_idx      on public.items (owner_id, created_at desc);
create index items_public_idx     on public.items (created_at desc) where privacy = 'public';
create index items_tags_idx       on public.items using gin (tags);
create index items_storage_idx    on public.items (storage_path) where storage_path is not null;

alter table public.items enable row level security;

create policy "items: ver públicos ou próprios"
  on public.items for select to anon, authenticated
  using (privacy = 'public' or owner_id = (select auth.uid()));

create policy "items: criar como dono"
  on public.items for insert to authenticated
  with check (owner_id = (select auth.uid()) and source = 'upload');

create policy "items: editar os próprios"
  on public.items for update to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "items: excluir os próprios"
  on public.items for delete to authenticated
  using (owner_id = (select auth.uid()));

-- Colunas liberadas: dono, origem e datas nunca vêm do cliente.
revoke all on public.items from anon, authenticated;
grant select on public.items to anon, authenticated;
grant insert (kind, title, description, privacy, storage_path, width, height, tags, metadata)
  on public.items to authenticated;
grant update (title, description, privacy, share_token, tags, metadata)
  on public.items to authenticated;
grant delete on public.items to authenticated;

-- Cota: ninguém lota o armazenamento. Ajuste o limite aqui.
create function public.enforce_item_quota()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is not null
     and (select count(*) from public.items where owner_id = new.owner_id) >= 2000 then
    raise exception 'Limite de itens por conta atingido' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger items_quota
  before insert on public.items
  for each row execute function public.enforce_item_quota();

-- item_links ----------------------------------------------------------------
create table public.item_links (
  parent_id  uuid not null references public.items (id) on delete cascade,
  child_id   uuid not null references public.items (id) on delete cascade,
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (parent_id, child_id),
  check (parent_id <> child_id)
);

create index item_links_child_idx on public.item_links (child_id);

alter table public.item_links enable row level security;

-- As subconsultas em `items` já passam pela RLS de quem consulta.
create policy "item_links: ver se o pai é visível"
  on public.item_links for select to anon, authenticated
  using (exists (select 1 from public.items p where p.id = parent_id));

create policy "item_links: montar no que é seu"
  on public.item_links for insert to authenticated
  with check (
    exists (select 1 from public.items p where p.id = parent_id and p.owner_id = (select auth.uid()))
    and exists (select 1 from public.items c where c.id = child_id)
  );

create policy "item_links: reordenar no que é seu"
  on public.item_links for update to authenticated
  using (exists (select 1 from public.items p where p.id = parent_id and p.owner_id = (select auth.uid())));

create policy "item_links: remover do que é seu"
  on public.item_links for delete to authenticated
  using (exists (select 1 from public.items p where p.id = parent_id and p.owner_id = (select auth.uid())));

revoke all on public.item_links from anon, authenticated;
grant select on public.item_links to anon, authenticated;
grant insert (parent_id, child_id, position), delete on public.item_links to authenticated;
grant update (position) on public.item_links to authenticated;

-- reactions -----------------------------------------------------------------
create table public.reactions (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id    uuid not null references public.items (id) on delete cascade,
  kind       text not null default 'favorite' check (kind ~ '^[a-z_]{2,30}$'),
  created_at timestamptz not null default now(),
  primary key (user_id, item_id, kind)
);

create index reactions_item_idx on public.reactions (item_id, kind);
create index reactions_user_idx on public.reactions (user_id, kind, created_at desc);

alter table public.reactions enable row level security;

create policy "reactions: ver as próprias"
  on public.reactions for select to authenticated
  using (user_id = (select auth.uid()));

create policy "reactions: reagir a itens que posso ver"
  on public.reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.items i where i.id = item_id)
  );

create policy "reactions: desfazer as próprias"
  on public.reactions for delete to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.reactions from anon, authenticated;
grant select, delete on public.reactions to authenticated;
grant insert (item_id, kind) on public.reactions to authenticated;
