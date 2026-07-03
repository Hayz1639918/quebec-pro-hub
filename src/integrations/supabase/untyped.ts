import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './client';

/**
 * Client Supabase non typé pour les tables absentes des types générés
 * (src/integrations/supabase/types.ts est obsolète : 4 tables sur ~30).
 * À supprimer après régénération des types via `supabase gen types`.
 */
export const db: SupabaseClient = supabase as unknown as SupabaseClient;
