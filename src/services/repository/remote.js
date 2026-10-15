import { prepareImage } from '../../lib/image';
import { fromRow } from '../../features/photos/model';

const BUCKET = 'photos';

/** Repositório com Supabase: Postgres (RLS) + Storage. */
export function createRemoteRepository(supabase) {
  const publicUrl = (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const toPhoto = (row) => fromRow(row, publicUrl(row.storage_path));

  return {
    mode: 'remote',

    async listPhotos() {
      // A RLS já garante: fotos públicas + as do próprio usuário.
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data.map(toPhoto);
    },

    async addPhoto({ file, title, category, isPublic, userId }) {
      const { blob, width, height } = await prepareImage(file);
      const path = `${userId}/${crypto.randomUUID()}.jpg`;

      const up = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
      if (up.error) throw up.error;

      const { data, error } = await supabase
        .from('photos')
        .insert({ title, category, is_public: isPublic, storage_path: path, width, height })
        .select()
        .single();
      if (error) {
        await supabase.storage.from(BUCKET).remove([path]); // não deixa arquivo órfão
        throw error;
      }
      return toPhoto(data);
    },

    async removePhoto(photo) {
      const { data, error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photo.id)
        .select('storage_path')
        .single();
      if (error) throw error;
      await supabase.storage.from(BUCKET).remove([data.storage_path]);
    },

    async listFavorites() {
      const { data, error } = await supabase
        .from('favorites')
        .select('photo')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data.map((row) => row.photo);
    },

    async addFavorite(key, photo) {
      const { error } = await supabase.from('favorites').upsert({ photo_key: key, photo });
      if (error) throw error;
    },

    async removeFavorite(key) {
      const { error } = await supabase.from('favorites').delete().eq('photo_key', key);
      if (error) throw error;
    },
  };
}
