import type { Profile } from './member';

export const CHANNELS = [
  { id: 'general', label: 'general' },
  { id: 'events', label: 'events' },
  { id: 'rooms-recs', label: 'rooms & recs' },
  { id: 'work', label: 'work' },
  { id: 'care', label: 'care' },
] as const;
export type ChannelId = (typeof CHANNELS)[number]['id'];

export const channelLabel = (id: string) => CHANNELS.find((c) => c.id === id)?.label ?? id;
export const isChannel = (id: string): id is ChannelId => CHANNELS.some((c) => c.id === id);

// Mirrors the database rule can_use_back_room(): The Club, The Inner Circle, the team, and admins
export const canUseBackRoom = (p: Profile) => p.is_admin || !!p.is_team || p.tier === 'club' || p.tier === 'inner_circle';

export type Thread = {
  id: number;
  channel: string;
  title: string;
  body: string;
  author_id: string;
  author_name: string | null;
  author_is_team?: boolean;
  reply_count: number;
  created_at: string;
  last_activity_at: string;
  hidden: boolean;
};

export type Reply = {
  id: number;
  thread_id: number;
  body: string;
  author_id: string;
  author_name: string | null;
  author_is_team?: boolean;
  created_at: string;
  hidden: boolean;
};

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Accra' });
}
