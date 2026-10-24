# AFTR. Community — members app

The members app for AFTR., a members-only social club in Accra. Built as an
installable web app (PWA) first; native iOS/Android come later.

## Run it

```bash
npm install
npm run dev     # then open http://localhost:3000 on your phone or browser
```

## What's here so far

| Area | Status |
| --- | --- |
| Welcome screen | Built. Uses the aftr.community hero photo |
| Gallery | Built. 9 events × 6 photos, names and order match aftr.community/gallery |
| Home, Events, Card, Forum, Join | Placeholder screens with the design's shell |
| Logins, applications, membership tiers | Next: Supabase |

Design source: the "AFTR. App v2" Claude Design file (Nocturne design system).

## Privacy rules for this codebase

- **Gallery photos never go in `/public`.** They live in `/private/gallery` and
  are served only through `app/media/gallery`. Once logins exist, that route
  must check the visitor is an approved member. **Do not deploy publicly until
  that check is in place.**
- Photos are stripped of camera metadata (including location) when added.
- Every page is marked `noindex`; link previews use the discreet description only.
- Never store orientation, gender identity or ID documents for members.

## Adding gallery photos

Put photos in `private/gallery/<event-slug>/` as `01.jpg`, `02.jpg`… plus
`thumb-01.jpg`… (long edge about 1600px and 640px), then add or update the
event in `lib/gallery.ts`.
