import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserCompetitorIds, getUserId } from '@/lib/workspace';

interface AlertsState {
  unreadCount: number;
  refresh: () => Promise<void>;
}

let cachedUnread = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function useAlerts(): AlertsState {
  const [unreadCount, setUnreadCount] = useState(cachedUnread);

  useEffect(() => {
    const update = () => setUnreadCount(cachedUnread);
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  return {
    unreadCount,
    async refresh() {
      const competitorIds = await getUserCompetitorIds();
      if (competitorIds.length === 0) {
        cachedUnread = 0;
        emit();
        return;
      }

      const { count, error } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
        .in('competitor_id', competitorIds);
      if (!error) {
        cachedUnread = count ?? 0;
        emit();
      }
    },
  };
}

export function bumpUnreadCache(delta: number) {
  cachedUnread = Math.max(0, cachedUnread + delta);
  emit();
}

export function setUnreadCache(value: number) {
  cachedUnread = Math.max(0, value);
  emit();
}
