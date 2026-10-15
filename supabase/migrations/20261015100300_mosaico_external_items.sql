-- ============================================================================
-- MÓDULO MOSAICO: específico do app. Fotos do Pexels viram itens (sem dono)
-- no momento em que alguém as favorita, para o favorito apontar para um item real.
-- ============================================================================

-- Só aceitamos imagens vindas do domínio do Pexels, para ninguém plantar
-- um endereço qualquer que apareça para outras pessoas.
alter table public.items add constraint items_pexels_url_check
  check (
    source <> 'pexels'
    or (metadata ->> 'url') ~ '^https://images\.pexels\.com/'
  );

create function public.save_external_item(
  p_source      text,
  p_external_id text,
  p_title       text,
  p_width       integer,
  p_height      integer,
  p_tags        text[],
  p_metadata    jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Login necessário' using errcode = '28000';
  end if;
  if p_source <> 'pexels' then
    raise exception 'Origem não suportada' using errcode = '22023';
  end if;

  -- Quem chegou primeiro define os dados; ninguém sobrescreve o item de outro.
  insert into public.items (owner_id, kind, title, privacy, source, external_id, width, height, tags, metadata)
  values (null, 'photo', left(p_title, 120), 'public', p_source, p_external_id,
          p_width, p_height, coalesce(p_tags, '{}'), coalesce(p_metadata, '{}'))
  on conflict (source, external_id) do nothing;

  select id into v_id from public.items
  where source = p_source and external_id = p_external_id;
  return v_id;
end;
$$;

revoke all on function public.save_external_item(text, text, text, integer, integer, text[], jsonb)
  from public, anon;
grant execute on function public.save_external_item(text, text, text, integer, integer, text[], jsonb)
  to authenticated;
