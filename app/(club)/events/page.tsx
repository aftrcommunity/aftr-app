import Link from 'next/link';
import { AFTR_EVENTS, TOWN_EVENTS, formatDate } from '../../../lib/events';

export default async function Events({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const town = (await searchParams).tab === 'around-town';

  return (
    <main className="page">
      <h1 className="display">Events</h1>
      <div className="seg events-seg" role="group" aria-label="Which events">
        <Link href="/events" className={town ? '' : 'on'} aria-pressed={!town}>
          AFTR. events
        </Link>
        <Link href="/events?tab=around-town" className={town ? 'on' : ''} aria-pressed={town}>
          Around town
        </Link>
      </div>

      {!town ? (
        <>
          <p className="muted intro">
            Exact venues are shared privately with confirmed members closer to each date.
          </p>
          <div className="event-list">
            {AFTR_EVENTS.map((e) => (
              <article key={e.id} className="event-card">
                {e.photo ? (
                  <div
                    className="event-photo"
                    style={{ backgroundImage: `url(${e.photo})`, backgroundPosition: e.photoPosition ?? 'center' }}
                    aria-hidden
                  />
                ) : (
                  <div className="event-photo event-photo-type" aria-hidden>
                    <span>AFTR.</span>
                  </div>
                )}
                <div className="event-body">
                  <div className="event-date">
                    {formatDate(e.date)}
                    {e.sample && <span className="tag">Sample</span>}
                  </div>
                  <h2 className="event-title">{e.title}</h2>
                  <p className="event-tagline">{e.tagline}</p>
                  {e.ticketUrl ? (
                    <a className="event-btn" href={e.ticketUrl} target="_blank" rel="noopener noreferrer">
                      Get tickets ↗
                    </a>
                  ) : (
                    <span className="event-btn is-off">{e.date ? 'Ticket link coming soon' : 'Details coming soon'}</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="muted intro">
            What else is on, from organisers we trust. Not run by AFTR. and not always women-only, but friendly to our
            community. Tickets are sold by each organiser.
          </p>
          <div className="town-list">
            {TOWN_EVENTS.map((e) => (
              <article key={e.id} className="town-card">
                <div className="event-date">
                  {formatDate(e.date)} · {e.area}
                  {e.example && <span className="tag">Example</span>}
                </div>
                <h2 className="town-title">{e.title}</h2>
                <p className="town-meta">By {e.organiser}</p>
                <p className="event-tagline">{e.note}</p>
                {e.ticketUrl ? (
                  <a className="town-link" href={e.ticketUrl} target="_blank" rel="noopener noreferrer">
                    Tickets on the organiser&apos;s site ↗
                  </a>
                ) : (
                  <span className="town-link is-off">Ticket link added when listed</span>
                )}
              </article>
            ))}
          </div>
          <div className="soon">
            <div className="label">For organisers</div>
            <p>Run something the AFTR. community would love? Message the team to have your event listed here.</p>
          </div>
        </>
      )}
    </main>
  );
}
