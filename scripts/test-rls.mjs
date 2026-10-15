// Teste de integração das regras de segurança (RLS) contra o Supabase LOCAL.
// Uso: npm run db:start && npm run db:test
// Cria dois usuários descartáveis e tenta acessos que NÃO devem funcionar.
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321';
const KEY = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
if (!KEY) {
  console.error('Defina SUPABASE_ANON_KEY (veja `npx supabase status`).');
  process.exit(1);
}
if (!/127\.0\.0\.1|localhost/.test(URL)) {
  console.error('Este teste cria dados e só roda contra o banco local.');
  process.exit(1);
}

const client = () => createClient(URL, KEY, { auth: { persistSession: false } });
const run = Date.now();
const JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64',
);

let passed = 0;
const failures = [];
function check(name, condition, detail = '') {
  if (condition) passed++;
  else failures.push(`${name} ${detail}`);
  console.log(`${condition ? '  ok ' : ' FALHOU'}  ${name}`);
}

async function user(label) {
  const c = client();
  const { data, error } = await c.auth.signUp({
    email: `${label}-${run}@teste.local`,
    password: 'senha-de-teste-123',
    options: { data: { name: `Teste ${label}` } },
  });
  if (error || !data.session) throw new Error(`signUp ${label}: ${error?.message ?? 'sem sessão'}`);
  return { c, id: data.user.id };
}

async function uploadPhoto(u, privacy) {
  const path = `${u.id}/${crypto.randomUUID()}.jpg`;
  const up = await u.c.storage.from('media').upload(path, JPEG, { contentType: 'image/jpeg' });
  if (up.error) throw new Error(`upload: ${up.error.message}`);
  const { data, error } = await u.c
    .from('items')
    .insert({ kind: 'photo', title: 'Foto de teste', privacy, storage_path: path, width: 1, height: 1 })
    .select()
    .single();
  if (error) throw new Error(`insert item: ${error.message}`);
  return data;
}

const a = await user('a');
const b = await user('b');
const anon = client();

console.log('\nPerfis');
const { data: prof } = await a.c.from('profiles').select('id, display_name').eq('id', a.id);
check('perfil criado automaticamente no cadastro', prof?.length === 1 && prof[0].display_name === 'Teste a');
const { error: upProfile } = await b.c.from('profiles').update({ bio: 'invadido' }).eq('id', a.id);
const { data: bioCheck } = await anon.from('profiles').select('bio').eq('id', a.id).single();
check('outra pessoa não edita meu perfil', bioCheck?.bio !== 'invadido', upProfile?.message);

console.log('\nPrivacidade de itens');
const priv = await uploadPhoto(a, 'private');
check('dono vê a própria foto privada', (await a.c.from('items').select('id').eq('id', priv.id)).data?.length === 1);
check('outro usuário NÃO vê foto privada', (await b.c.from('items').select('id').eq('id', priv.id)).data?.length === 0);
check('visitante NÃO vê foto privada', (await anon.from('items').select('id').eq('id', priv.id)).data?.length === 0);

const unlisted = await uploadPhoto(a, 'unlisted');
check('item "por link" NÃO aparece em listagens', (await b.c.from('items').select('id').eq('id', unlisted.id)).data?.length === 0);
check('token de compartilhamento não vaza para terceiros', (await anon.from('items').select('share_token').eq('id', unlisted.id)).data?.length === 0);

const pub = await uploadPhoto(a, 'public');
check('foto pública é visível para outro usuário', (await b.c.from('items').select('id').eq('id', pub.id)).data?.length === 1);
check('foto pública é visível para visitante', (await anon.from('items').select('id').eq('id', pub.id)).data?.length === 1);

console.log('\nEscrita');
const upd = await b.c.from('items').update({ title: 'hackeado' }).eq('id', pub.id).select();
check('outro usuário NÃO edita meu item', (upd.data?.length ?? 0) === 0);
const del = await b.c.from('items').delete().eq('id', pub.id).select();
check('outro usuário NÃO exclui meu item', (del.data?.length ?? 0) === 0);
const forged = await b.c.from('items').insert({ kind: 'photo', title: 'x', storage_path: 'x', owner_id: a.id });
check('não dá para criar item em nome de outra pessoa', !!forged.error);
const chown = await a.c.from('items').update({ owner_id: b.id }).eq('id', pub.id);
check('dono não consegue transferir/alterar owner_id direto', !!chown.error);
const anonWrite = await anon.from('items').insert({ kind: 'photo', title: 'x', storage_path: 'x' });
check('visitante NÃO cria itens', !!anonWrite.error);
const tooLong = await a.c.from('items').insert({ kind: 'photo', title: 'x'.repeat(200), storage_path: 'p' });
check('título acima de 120 caracteres é recusado', !!tooLong.error);

console.log('\nArquivos');
const intrude = await b.c.storage.from('media').upload(`${a.id}/invasor.jpg`, JPEG, { contentType: 'image/jpeg' });
check('não dá para enviar arquivo na pasta de outra pessoa', !!intrude.error);
const signPriv = await b.c.storage.from('media').createSignedUrl(priv.storage_path, 60);
check('outro usuário NÃO gera link da foto privada', !!signPriv.error || !signPriv.data?.signedUrl);
const signPub = await anon.storage.from('media').createSignedUrl(pub.storage_path, 60);
check('visitante gera link da foto pública', !!signPub.data?.signedUrl);
const direct = await fetch(`${URL}/storage/v1/object/public/media/${priv.storage_path}`);
check('bucket não é público (URL direta falha)', !direct.ok);

console.log('\nFavoritos (reactions)');
const fav = await b.c.from('reactions').insert({ item_id: pub.id, kind: 'favorite' });
check('posso favoritar item público', !fav.error, fav.error?.message);
const favPriv = await b.c.from('reactions').insert({ item_id: priv.id, kind: 'favorite' });
check('NÃO posso favoritar item privado de outra pessoa', !!favPriv.error);
check('não vejo favoritos de outra pessoa', ((await a.c.from('reactions').select('item_id')).data ?? []).length === 0);
const forgedFav = await b.c.from('reactions').insert({ item_id: pub.id, kind: 'like', user_id: a.id });
check('não dá para reagir em nome de outra pessoa', !!forgedFav.error);

console.log('\nÁlbuns (item_links)');
const { data: album } = await a.c.from('items').insert({ kind: 'album', title: 'Meu álbum', privacy: 'private' }).select().single();
const link = await a.c.from('item_links').insert({ parent_id: album.id, child_id: pub.id });
check('dono monta o próprio álbum', !link.error, link.error?.message);
check('álbum privado: terceiros não veem o conteúdo', ((await b.c.from('item_links').select('child_id').eq('parent_id', album.id)).data ?? []).length === 0);
const hijack = await b.c.from('item_links').insert({ parent_id: album.id, child_id: pub.id });
check('terceiro NÃO adiciona foto no álbum alheio', !!hijack.error);
await a.c.from('items').update({ privacy: 'public' }).eq('id', album.id);
check('álbum público: terceiros veem o conteúdo', ((await b.c.from('item_links').select('child_id').eq('parent_id', album.id)).data ?? []).length === 1);

console.log('\nSeguir');
check('posso seguir alguém', !(await b.c.from('follows').insert({ followed_id: a.id })).error);
check('NÃO posso seguir em nome de outra pessoa', !!(await b.c.from('follows').insert({ followed_id: b.id, follower_id: a.id })).error);
check('NÃO posso seguir a mim mesmo', !!(await a.c.from('follows').insert({ followed_id: a.id })).error);

console.log('\nItens externos (Pexels)');
const ext = (over = {}) => ({
  p_source: 'pexels',
  p_external_id: `px-${run}`,
  p_title: 'Foto externa',
  p_width: 100,
  p_height: 100,
  p_tags: ['Natureza'],
  p_metadata: { url: 'https://images.pexels.com/photos/1/a.jpg' },
  ...over,
});
check('visitante NÃO salva item externo', !!(await anon.rpc('save_external_item', ext())).error);
const r1 = await b.c.rpc('save_external_item', ext());
const r2 = await a.c.rpc('save_external_item', ext({ p_title: 'Sobrescrita' }));
check('usuário logado salva item externo', !r1.error && !!r1.data, r1.error?.message);
check('mesmo item devolve o mesmo id (sem duplicar)', r1.data === r2.data);
const { data: extRow } = await anon.from('items').select('title').eq('id', r1.data).single();
check('segundo usuário NÃO sobrescreve dados do item externo', extRow?.title === 'Foto externa');
check('URL fora do Pexels é recusada', !!(await b.c.rpc('save_external_item', ext({ p_external_id: `bad-${run}`, p_metadata: { url: 'https://evil.example/x.jpg' } }))).error);
check('origem desconhecida é recusada', !!(await b.c.rpc('save_external_item', ext({ p_source: 'outro' }))).error);

console.log('\nLimpeza e cascata');
await a.c.from('items').delete().eq('id', pub.id);
check('excluir item remove reações ligadas a ele (cascata)', ((await b.c.from('reactions').select('item_id').eq('item_id', pub.id)).data ?? []).length === 0);

console.log(`\n${passed} verificações ok, ${failures.length} falha(s).`);
if (failures.length) {
  console.log('\nFalhas:\n- ' + failures.join('\n- '));
  process.exit(1);
}
