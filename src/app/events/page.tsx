'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Event {
  id: number;
  artist: string;
  date: string;
  soldOut: boolean;
  ticketUrl: string | null;
  scrapedAt: string;
  venue: { name: string; city: string | null };
}

function EventsContent() {
  const params = useSearchParams();
  const initialArtist = params.get('artist') ?? '';

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialArtist);
  const [soldOutOnly, setSoldOutOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) qs.set('artist', search);
    if (soldOutOnly) qs.set('soldOut', 'true');
    const res = await fetch(`/api/events?${qs}`);
    setEvents(await res.json());
    setLoading(false);
  }, [search, soldOutOnly]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-5xl mb-2">EVENTS</h1>
        <p className="text-[#555] text-sm">All scraped shows across tracked venues.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <input
          placeholder="Search artist..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />
        <label className="flex items-center gap-2 text-sm text-[#888] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soldOutOnly}
            onChange={(e) => setSoldOutOnly(e.target.checked)}
            className="w-auto accent-[#4d65ff]"
          />
          Sold out only
        </label>
        {(search || soldOutOnly) && (
          <button
            onClick={() => { setSearch(''); setSoldOutOnly(false); }}
            className="text-xs text-[#555] hover:text-white transition-colors"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-[#444]">
          {loading ? '...' : `${events.length} shows`}
        </span>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-[#444] animate-pulse">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-3xl text-[#333] mb-2">NO EVENTS</p>
          <p className="text-[#444] text-sm">
            {search || soldOutOnly ? 'No events match your filters.' : (
              <>Run a scrape from <Link href="/venues" className="text-[#4d65ff] hover:underline">Venues</Link> to populate data.</>
            )}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Artist</th>
                <th>Date</th>
                <th>Venue</th>
                <th>City</th>
                <th>Status</th>
                <th>Scraped</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt) => (
                <tr key={evt.id}>
                  <td>
                    <span
                      className="text-white font-semibold cursor-pointer hover:text-[#4d65ff] transition-colors"
                      onClick={() => setSearch(evt.artist)}
                    >
                      {evt.artist}
                    </span>
                  </td>
                  <td className="font-mono text-sm">
                    {new Date(evt.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td>{evt.venue.name}</td>
                  <td className="text-[#555]">{evt.venue.city ?? '—'}</td>
                  <td>
                    {evt.soldOut ? (
                      <span className="sold-out-badge">Sold Out</span>
                    ) : (
                      <span className="text-xs text-[#444]">Available</span>
                    )}
                  </td>
                  <td className="text-[#444] text-xs font-mono">
                    {new Date(evt.scrapedAt).toLocaleDateString()}
                  </td>
                  <td>
                    {evt.ticketUrl && (
                      <a
                        href={evt.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#4d65ff] hover:underline"
                      >
                        Tickets ↗
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="text-[#444] p-8">Loading...</div>}>
      <EventsContent />
    </Suspense>
  );
}
