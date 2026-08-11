import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type Profile = Tables<'profiles'>;

/**
 * Fetches the complete profile through an owner-bound RPC. This avoids
 * granting browser roles table-wide SELECT access to private profile fields.
 */
export async function getMyProfile(): Promise<Profile | null> {
  const { data, error } = await supabase.rpc('get_my_profile');
  if (error) throw error;
  return data?.[0] || null;
}
