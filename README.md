# AFTR. Community — members app

The members app for AFTR., a members-only social club in Accra. Built as an
installable web app (PWA) first; native iOS/Android come later.

## Run it

```bash
npm install
npm run dev     # then open http://localhost:3000 on your phone or browser
```

## Setup

1. Copy `.env.example` to `.env.local` (values are the public Supabase URL and publishable key).
2. Run `supabase/001_setup.sql` once in Supabase → SQL Editor.
3. In Supabase → Authentication → URL Configuration, add the app's address (and
   `http://localhost:3000/**` for local testing) to the redirect URLs.
4. Sign in once with your email, then run the "make yourself the first admin"
   lines at the bottom of the SQL file.

## What's here so far

| Area | Status |
| --- | --- |
| Welcome screen | Built. Uses the aftr.community hero photo |
| Gallery | Built. 9 events × 6 photos, names and order match aftr.community/gallery |
| Events | AFTR. events and Around town (partner organisers' events) |
| Sign-in | Passwordless email link or 6-digit code (Supabase) |
| Application form | Built; every applicant reviewed by a person |
| Review queue (/admin) | Built: approve with a tier, waitlist, decline, private notes, paid-until |
| Members-only check | All club screens and gallery photos require an approved member |
| Home, Card QR, Forum | Next |

Design source: the "AFTR. App v2" Claude Design file (Nocturne design system).

## Privacy rules for this codebase

- **Gallery photos never go in `/public`.** They live in `/private/gallery` and
  are served only through `app/media/gallery`, which checks the visitor is an
  approved member (database function `is_approved_member`).
- Every table has row level security. Members can't change their own status,
  tier or admin flag; only `review_application()` can, and only for admins.
- Never put the Supabase secret / service_role key in this app.
- Photos are stripped of camera metadata (including location) when added.
- Every page is marked `noindex`; link previews use the discreet description only.
- Never store orientation, gender identity or ID documents for members.

## Adding gallery photos

Put photos in `private/gallery/<event-slug>/` as `01.jpg`, `02.jpg`… plus
`thumb-01.jpg`… (long edge about 1600px and 640px), then add or update the
event in `lib/gallery.ts`.
