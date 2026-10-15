import { prepareImage } from '../../lib/image';
import { fromItem } from '../../features/photos/model';

const BUCKET = 'media';
const SIGNED_URL_TTL = 60 * 60; // 1 h; recarregar a página gera links novos
const DUPLICATE = '23505';

/**
 * Repositório com Supabase. Fala só com as tabelas `items` e `reactions`
 * (mais a função `save_external_item`) e com o bucket fechado `media`.
 */
export function createRemoteRepository(supabase) {
  /** Uploads precisam de link temporário: gera todos de uma vez, em 1 chamada. */
  async function toPhotos(items) {
    const paths = items.map((i) => i.storage_path).filter(Boolean);
    const urls = new Map();
    if (paths.length) {
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_TTL);
      if (error) throw error;
      data.forEach((entry) => entry.signedUrl && urls.set(entry.path, entry.signedUrl));
    }
    return items.map((i) => fromItem(i, urls.get(i.storage_path))).filter(Boolean);
  }

  return {
    mode: 'remote',

    async listPhotos() {
      // A RLS entrega: fotos públicas + as do próprio usuário.
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('kind', 'photo')
        .eq('source', 'upload')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return toPhotos(data);
    },

    async addPhoto({ file, title, category, isPublic, userId }) {
      const { blob, width, height } = await prepareImage(file);
      const path = `${userId}/${crypto.randomUUID()}.jpg`;

      const up = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (up.error) throw up.error;

      const { data, error } = await supabase
        .from('items')
        .insert({
          kind: 'photo',
          title,
          privacy: isPublic ? 'public' : 'private',
          storage_path: path,
          width,
          height,
          tags: category ? [category] : [],
        })
        .select()
        .single();
      if (error) {
        await supabase.storage.from(BUCKET).remove([path]); // não deixa arquivo órfão
        throw error;
      }
      return (await toPhotos([data]))[0];
    },

    async removePhoto(photo) {
      const { data, error } = await supabase
        .from('items')
        .delete()
        .eq('id', photo.id)
        .select('storage_path')
        .single();
      if (error) throw error;
      if (data.storage_path) await supabase.storage.from(BUCKET).remove([data.storage_path]);
    },

    async listFavorites() {
      const { data, error } = await supabase
        .from('reactions')
        .select('item:items(*)')
        .eq('kind', 'favorite')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return toPhotos(data.map((row) => row.item).filter(Boolean));
    },

    async addFavorite(_key, photo) {
      let itemId = photo.id;
      if (photo.source === 'pexels') {
        // Foto externa: vira um item (sem dono) para o favorito apontar para algo real.
        const { data, error } = await supabase.rpc('save_external_item', {
          p_source: 'pexels',
          p_external_id: photo.id,
          p_title: photo.title,
          p_width: photo.width,
          p_height: photo.height,
          p_tags: photo.category ? [photo.category] : [],
          p_metadata: {
            url: photo.url,
            thumb: photo.thumb,
            color: photo.color,
            author: photo.author,
            authorUrl: photo.authorUrl,
          },
        });
        if (error) throw error;
        itemId = data;
      }
      const { error } = await supabase.from('reactions').insert({ item_id: itemId, kind: 'favorite' });
      if (error && error.code !== DUPLICATE) throw error;
    },

    async removeFavorite(key) {
      const [source, ...rest] = key.split(':');
      const externalOrItemId = rest.join(':');
      let itemId = externalOrItemId;
      if (source === 'pexels') {
        const { data, error } = await supabase
          .from('items')
          .select('id')
          .eq('source', 'pexels')
          .eq('external_id', externalOrItemId)
          .maybeSingle();
        if (error) throw error;
        if (!data) return;
        itemId = data.id;
      }
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('item_id', itemId)
        .eq('kind', 'favorite');
      if (error) throw error;
    },
  };
}
