import { createClient } from '@supabase/supabase-js';
import { env } from './env';

/** `null` quando o Supabase não está configurado: o app cai no modo local. */
export const supabase =
  env.supabaseUrl && env.supabaseKey ? createClient(env.supabaseUrl, env.supabaseKey) : null;
