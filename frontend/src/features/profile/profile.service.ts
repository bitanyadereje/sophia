import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types';

export const loadProfile = async (userId: string): Promise<Pick<UserProfile, 'name' | 'avatar'>> => {
  const { data, error } = await supabase.from('profiles').select('id, name, username, avatar_url').eq('id', userId).maybeSingle();
  if (error) throw error;
  if (data) return { name: data.name || data.username || 'Reader', avatar: data.avatar_url || '' };
  const { data: authData } = await supabase.auth.getUser();
  return { name: authData.user?.user_metadata?.name || authData.user?.email || 'Reader', avatar: '' };
};

export const updateProfile = async (userId: string, updated: Partial<UserProfile>) => {
  const { error } = await supabase.from('profiles').update({ name: updated.name, avatar_url: updated.avatar }).eq('id', userId);
  if (error) throw error;
};

export const uploadAvatar = async (userId: string, file: File) => {
  const extension = file.name.split('.').pop();
  const path = `${userId}-${Date.now()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file);
  if (uploadError) throw uploadError;
  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
  if (updateError) throw updateError;
  return publicUrl;
};
