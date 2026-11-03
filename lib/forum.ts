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
  photos?: string[];
  edited_at?: string | null;
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
  parent_id?: number | null;
  edited_at?: string | null;
};

export type Reaction = { thread_id: number; reply_id: number | null; user_id: string; kind: 'like' | 'love' };

// What a member can report something for (shown on the report form; the first part is the label)
export const REPORT_CATEGORIES = [
  { id: 'privacy', label: 'Sharing the club outside it, or outing someone', detail: 'Screenshots, posts, messages, photos or member names shared outside the club, or revealing who someone is without their permission.' },
  { id: 'harassment', label: 'Harassment, bullying or unwanted contact', detail: 'Targets, threatens, intimidates or shames someone.' },
  { id: 'hate', label: 'Hate speech or discrimination', detail: 'Attacks or demeans people for their race, ethnicity, religion, gender, sexual orientation or disability, or promotes violence against them.' },
  { id: 'sexual', label: 'Nudity or sexual activity', detail: 'Explicit images, non-consensual sexual content, or unwanted sexualisation.' },
  { id: 'violence', label: 'Violence, threats or harmful organisations', detail: 'Direct threats of physical violence, graphic violence, or promoting dangerous groups.' },
  { id: 'self_harm', label: 'Suicide or self-injury', detail: 'Encourages, shows or gives instructions for self-harm or eating disorders.' },
  { id: 'false_info', label: 'False information', detail: 'Misleading claims, manipulated media or hoaxes meant to deceive.' },
  { id: 'spam', label: 'Spam, fraud or scams', detail: 'Deceptive selling, phishing links, fake giveaways or pretending to be someone else.' },
  { id: 'ip', label: 'Copyright or trademark', detail: 'Uses someone else’s work or brand without permission.' },
  { id: 'illegal_sales', label: 'Selling restricted or illegal items', detail: 'Drugs, weapons, counterfeit goods or other regulated products.' },
] as const;
export const isReportCategory = (v: string) => REPORT_CATEGORIES.some((c) => c.id === v);
export const reportCategoryLabel = (v: string | null) => REPORT_CATEGORIES.find((c) => c.id === v)?.label ?? 'No category';

export function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Africa/Accra' });
}
