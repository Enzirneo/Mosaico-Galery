import { supabase } from '../../lib/supabase';
import { createLocalRepository } from './local';
import { createRemoteRepository } from './remote';

/**
 * Único ponto que decide de onde vêm os dados do usuário.
 * Contrato: listPhotos, addPhoto, removePhoto, listFavorites, addFavorite, removeFavorite.
 */
export const repository = supabase ? createRemoteRepository(supabase) : createLocalRepository();
