-- ============================================================================
-- MÓDULO CORE: arquivos. Um bucket FECHADO; o app recebe links temporários.
-- Caminho padrão: {id_do_dono}/{arquivo}. O banco guarda só o caminho.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Gerar link temporário exige permissão de leitura: do dono, ou de arquivo
-- cujo item é público. Itens "por link" só são abertos pela função `share`.
create policy "media: ler os próprios ou públicos"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'media'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.items i
        where i.storage_path = name and i.privacy = 'public'
      )
    )
  );

create policy "media: enviar na própria pasta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "media: excluir na própria pasta"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = (select auth.uid())::text);
