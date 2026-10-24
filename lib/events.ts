// Events shown in the app. Until the admin tools exist, edit this file to
// add or change events. Tickets are sold outside the app for the beta.

export type AftrEvent = {
  id: string;
  title: string;
  date: string | null; // ISO date (YYYY-MM-DD); null = date to be announced
  tagline: string;
  photo?: string;
  photoPosition?: string;
  ticketUrl?: string; // external ticket link, when there is one
  sample?: boolean; // placeholder content, not a confirmed event
};

// AFTR.'s own events — details as on aftr.community/events
export const AFTR_EVENTS: AftrEvent[] = [
  {
    id: 'happily-ever-aftr',
    title: 'Happily Ever AFTR.',
    date: '2026-10-31',
    tagline: 'A Fairytale Halloween Parté.',
    photo: '/images/events/happily-ever-aftr.jpg',
    photoPosition: 'center 40%',
  },
  {
    id: 'wdgd-7-detty-december',
    title: 'WDGD 7: Detty December',
    date: '2026-12-26',
    tagline: 'Dress code: pink, lilac, white.',
    photo: '/media/gallery/wdgd-4-detty-december/thumb-01.jpg',
  },
  {
    id: 'book-club-african-women-writers',
    title: 'Book Club: African Women Writers',
    date: null,
    tagline: 'A slow afternoon with a novel by an African woman writer, and good company.',
    sample: true,
  },
];

// "Around town": events by other organisers who share AFTR.'s values.
// Not run by AFTR. and not always women-only, but friendly to the community.
// Tickets are sold by the organiser, so each listing links out.
export type TownEvent = {
  id: string;
  title: string;
  organiser: string;
  date: string;
  area: string;
  note: string;
  ticketUrl?: string;
  example?: boolean; // placeholder until real partner listings are added
};

export const TOWN_EVENTS: TownEvent[] = [
  {
    id: 'example-1',
    title: 'Sunday brunch & live set',
    organiser: 'Partner organiser',
    date: '2026-11-08',
    area: 'Osu',
    note: 'Open to everyone; a relaxed daytime crowd.',
    example: true,
  },
  {
    id: 'example-2',
    title: 'Open-air film night',
    organiser: 'Partner organiser',
    date: '2026-11-21',
    area: 'Labone',
    note: 'Bring a blanket and a friend.',
    example: true,
  },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Sat 31 Oct" — computed in UTC so it never shifts a day (Accra is UTC+0 anyway)
export const formatDate = (iso: string | null) => {
  if (!iso) return 'Date to be announced';
  const d = new Date(`${iso}T00:00:00Z`);
  return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
};
