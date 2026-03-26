'use client';
import { useEffect, useState, useCallback } from 'react';
import ScrapeButton from '@/components/ScrapeButton';

interface Venue {
  id: number;
  name: string;
  url: string;
  city: string | null;
  active: boolean;
  createdAt: string;
  _count: { events: number; scrapeRuns: number };
  scrapeRuns: Array<{ status: string; createdAt: string; eventsFound: number; soldOutFound: number }>;
}

const DEFAULT_VENUES = [
  { name: 'The Echo / Echoplex', url: 'https://www.theecho.com', city: 'Los Angeles, CA' },
];

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', url: '', city: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/venues');
    setVenues(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addVenue(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setForm({ name: '', url: '', city: '' });
    setSaving(false);
    load();
  }

  async function addDefault(v: typeof DEFAULT_VENUES[0]) {
    setSaving(true);
    await fetch('/api/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(v),
    });
    setSaving(false);
    load();
  }

  async function deleteVenue(id: number) {
    if (!confirm('Remove this venue and all its events?')) return;
    await fetch('/api/venues', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  }

  const addedUrls = new Set(venues.map((v) => v.url));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-5xl mb-2">VENUES</h1>
        <p className="text-[#555] text-sm">Manage the venues you scrape for show data.</p>
      </div>

      {/* Quick add */}
      {DEFAULT_VENUES.filter((v) => !addedUrls.has(v.url)).length > 0 && (
        <div className="card p-5 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#555] mb-3">Quick Add</p>
          <div className="flex flex-wrap gap-2">
            {DEFAULT_VENUES.filter((v) => !addedUrls.has(v.url)).map((v) => (
              <button
                key={v.url}
                onClick={() => addDefault(v)}
                className="btn-ghost text-sm"
                disabled={saving}
              >
                + {v.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add form */}
      <div className="card p-5 mb-8">
        <p className="text-xs font-bold uppercase tracking-widest text-[#555] mb-4">Add Custom Venue</p>
        <form onSubmit={addVenue} className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#555]">Venue Name</label>
            <input
              placeholder="The Troubadour"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="w-48"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#555]">Website URL</label>
            <input
              placeholder="https://www.troubadour.com"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              required
              className="w-64"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-[#555]">City</label>
            <input
              placeholder="West Hollywood, CA"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="w-44"
            />
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>
            Add Venue
          </button>
        </form>
      </div>

      {/* Venue list */}
      {loading ? (
        <div className="card p-8 text-center text-[#444]">Loading...</div>
      ) : venues.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-3xl text-[#333] mb-2">NO VENUES YET</p>
          <p className="text-[#444] text-sm">Add The Echo above to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {venues.map((venue) => {
            const lastRun = venue.scrapeRuns[0];
            return (
              <div key={venue.id} className="card p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="font-semibold text-white text-lg">{venue.name}</h2>
                      {venue.city && (
                        <span className="text-xs text-[#555]">{venue.city}</span>
                      )}
                      <span
                        className={`text-xs font-bold uppercase tracking-wide ${
                          venue.active ? 'text-green-400' : 'text-[#444]'
                        }`}
                      >
                        {venue.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <a
                      href={venue.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#4d65ff] hover:underline font-mono"
                    >
                      {venue.url}
                    </a>
                    <div className="flex gap-6 mt-3">
                      <div>
                        <p className="text-xs text-[#555] mb-0.5">Total Events</p>
                        <p className="text-white font-semibold">{venue._count.events}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#555] mb-0.5">Scrape Runs</p>
                        <p className="text-white font-semibold">{venue._count.scrapeRuns}</p>
                      </div>
                      {lastRun && (
                        <div>
                          <p className="text-xs text-[#555] mb-0.5">Last Scrape</p>
                          <p className="text-white font-semibold text-sm">
                            {new Date(lastRun.createdAt).toLocaleDateString()}{' '}
                            <span className={lastRun.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                              ({lastRun.status})
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <ScrapeButton venueId={venue.id} onComplete={load} />
                    <button
                      onClick={() => deleteVenue(venue.id)}
                      className="text-xs text-[#444] hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
