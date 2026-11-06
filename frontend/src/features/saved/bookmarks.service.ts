import { supabase } from '../../lib/supabase';

export type SavedKind = 'review' | 'post' | 'path';

const CONFIG = {
  review: { table: 'saved_reviews', fk: 'review_id', target: 'reviews' },
  post: { table: 'saved_posts', fk: 'post_id', target: 'discussion_posts' },
  path: { table: 'saved_paths', fk: 'path_id', target: 'reading_paths' },
} as const;

export interface SavedItem {
  kind: SavedKind;
  savedAt: string;
  item: Record<string, any>;
}

export const loadSavedIds = async (userId: string, kind: SavedKind): Promise<string[]> => {
  const config = CONFIG[kind];
  const { data, error } = await supabase.from(config.table).select(config.fk).eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((row) => String((row as Record<string, unknown>)[config.fk]));
};

export const setSaved = async (userId: string, kind: SavedKind, itemId: string, save: boolean): Promise<void> => {
  const config = CONFIG[kind];
  const result = save
    ? await supabase.from(config.table).insert({ user_id: userId, [config.fk]: itemId })
    : await supabase.from(config.table).delete().eq('user_id', userId).eq(config.fk, itemId);

  if (result.error && !(save && result.error.code === '23505')) throw result.error;
};

export const loadSavedItems = async (userId: string): Promise<SavedItem[]> => {
  const results = await Promise.all((Object.keys(CONFIG) as SavedKind[]).map(async (kind) => {
    const config = CONFIG[kind];
    const { data: savedRows, error: savedRowsError } = await supabase
      .from(config.table)
      .select(`created_at, ${config.fk}`)
      .eq('user_id', userId);
    if (savedRowsError) throw savedRowsError;

    const rows = (savedRows ?? []) as Array<{ created_at: string } & Record<string, string>>;
    const ids = rows.map((row) => row[config.fk]).filter(Boolean);
    if (ids.length === 0) return [];

    const { data: targets, error: targetsError } = await supabase
      .from(config.target)
      .select('*')
      .in('id', ids);
    if (targetsError) throw targetsError;

    const targetById = new Map((targets ?? []).map((target) => {
      const item = target as Record<string, any>;
      return [String(item.id), item];
    }));
    return rows.flatMap((row) => {
      const item = targetById.get(row[config.fk]);
      return item ? [{ kind, savedAt: row.created_at, item }] : [];
    });
  }));

  return results.flat().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
};
