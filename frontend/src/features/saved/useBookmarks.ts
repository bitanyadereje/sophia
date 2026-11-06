import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { loadSavedIds, loadSavedItems, SavedKind, setSaved } from './bookmarks.service';

export const useBookmarks = (userId: string | null | undefined, kind: SavedKind, onShowToast?: (message: string) => void) => {
  const queryClient = useQueryClient();
  const queryKey = ['bookmarks', 'ids', kind, userId] as const;
  const { data: ids = [] } = useQuery({
    queryKey,
    queryFn: () => loadSavedIds(userId!, kind),
    enabled: Boolean(userId),
  });
  const savedIds = useMemo(() => new Set(ids), [ids]);
  const mutation = useMutation({
    mutationFn: ({ id, save }: { id: string; save: boolean }) => setSaved(userId!, kind, id, save),
    onMutate: async ({ id, save }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<string[]>(queryKey);
      queryClient.setQueryData<string[]>(queryKey, (current = []) => save
        ? [...new Set([...current, id])]
        : current.filter((savedId) => savedId !== id));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      onShowToast?.('Could not update bookmark.');
    },
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey }),
      queryClient.invalidateQueries({ queryKey: ['bookmarks', 'items', userId] }),
    ]),
  });

  return {
    isSaved: (id: string) => savedIds.has(id),
    toggle: (id: string) => {
      if (!userId) {
        onShowToast?.('Sign in to bookmark.');
        return;
      }
      const save = !savedIds.has(id);
      mutation.mutate({ id, save });
      onShowToast?.(save ? 'Bookmarked' : 'Removed from bookmarks');
    },
  };
};

export const useSavedItems = (userId: string | null | undefined) => useQuery({
  queryKey: ['bookmarks', 'items', userId],
  queryFn: () => loadSavedItems(userId!),
  enabled: Boolean(userId),
  refetchOnMount: 'always',
});
