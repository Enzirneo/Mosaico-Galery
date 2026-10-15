-- A opção "Enable automatic RLS" do Supabase cria public.rls_auto_enable() (trigger de evento).
-- Ela só precisa rodar como dono do banco; não deve ser chamável pela API (/rest/v1/rpc).
-- No banco local a função não existe, por isso a checagem.
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end;
$$;
