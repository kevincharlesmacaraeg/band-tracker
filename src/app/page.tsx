'use client';
import { useEffect, useState, useCallback } from 'react';
import ScrapeButton from '@/components/ScrapeButton';
import type { VenueReport, SoldOutShow } from './api/report/route';

export default function Dashboard() {
  const [reports, setReports] = useState<VenueReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/report');
    setReports(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalSoldOut = reports.reduce((s, r) => s + r.totalSoldOut, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#4d65ff] mb-2">
            237 Global · Venue Intelligence
          </p>
          <h1 className="font-display text-6xl text-white leading-none">
            TOP ARTISTS<br />
            <span className="text-[#333]">BY VENUE · BY MONTH</span>
          </h1>
          <p className="text-[#555] text-sm mt-3 max-w-lg">
            Sold-out shows ranked by ticket price — the highest price signals the most demand.
            Updated each time you scrape.
          </p>
        </div>
        <div className="text-right">
          <ScrapeButton onComplete={load} />
          {!loading && (
            <p className="text-xs text-[#444] mt-2">
              {totalSoldOut} sold-out shows across {reports.length} venues
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : reports.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-12">
          {reports.map((venue) => (
            <VenueSection key={venue.id} venue={venue} />
          ))}
        </div>
      )}
    </div>
  );
}

function VenueSection({ venue }: { venue: VenueReport }) {
  return (
    <div>
      {/* Venue header */}
      <div className="flex items-baseline gap-4 mb-5 pb-4 border-b border-[#1a1a1a]">
        <h2 className="font-display text-3xl text-white">{venue.name.toUpperCase()}</h2>
        {venue.city && <span className="text-sm text-[#444]">{venue.city}</span>}
        <span className="ml-auto text-xs text-[#333] font-mono">
          {venue.totalSoldOut} sold out
        </span>
      </div>

      {venue.months.length === 0 ? (
        <p className="text-[#333] text-sm italic">No sold-out shows yet — run a scrape.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {venue.months.map((m) => (
            <MonthCard key={m.month} month={m.month} shows={m.shows} />
          ))}
        </div>
      )}
    </div>
  );
}

function MonthCard({ month, shows }: { month: string; shows: SoldOutShow[] }) {
  const topShow = shows[0];

  return (
    <div className="card overflow-hidden">
      {/* Month label */}
      <div className="px-5 py-3 border-b border-[#1a1a1a] flex items-center justify-between">
        <span className="font-display text-lg text-[#888] tracking-wide">
          {month.toUpperCase()}
        </span>
        <span className="text-xs text-[#333]">{shows.length} sold out</span>
      </div>

      {/* Shows list */}
      <div className="divide-y divide-[#111]">
        {shows.map((show, i) => {
          const isTop = i === 0 && show.price != null;
          return (
            <div
              key={show.id}
              className={`px-5 py-3.5 flex items-start gap-3 ${isTop ? 'bg-[#0d1020]' : ''}`}
            >
              {/* Rank */}
              <span className={`font-display text-lg w-6 shrink-0 text-center ${
                isTop ? 'text-[#4d65ff]' : 'text-[#2a2a2a]'
              }`}>
                {i + 1}
              </span>

              {/* Artist + date */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`font-semibold text-sm leading-tight ${
                    isTop ? 'text-white' : 'text-[#aaa]'
                  }`}>
                    {show.artist}
                  </p>
                  {isTop && (
                    <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-[#4d65ff] border border-[#4d65ff33] bg-[#4d65ff11] px-1.5 py-0.5 rounded">
                      TOP
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-[#444]">{show.date}</span>
                  {show.price ? (
                    <span className={`text-xs font-bold font-mono ${
                      isTop ? 'text-[#4d65ff]' : 'text-[#555]'
                    }`}>
                      {show.price}
                    </span>
                  ) : (
                    <span className="sold-out-badge">SOLD OUT</span>
                  )}
                </div>
              </div>

              {/* Ticket link */}
              {show.ticketUrl && (
                <a
                  href={show.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[#333] hover:text-[#4d65ff] text-xs transition-colors mt-0.5"
                  title="View tickets"
                >
                  ↗
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      {[1].map((v) => (
        <div key={v}>
          <div className="h-8 w-64 bg-[#111] rounded mb-5" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((m) => (
              <div key={m} className="card p-5 animate-pulse">
                <div className="h-4 w-24 bg-[#1a1a1a] rounded mb-4" />
                {[1, 2, 3].map((s) => (
                  <div key={s} className="h-10 bg-[#111] rounded mb-2" />
                ))}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-16 text-center">
      <p className="font-display text-4xl text-[#222] mb-3">NO DATA YET</p>
      <p className="text-[#444] text-sm">
        Go to <a href="/venues" className="text-[#4d65ff] hover:underline">Venues</a>, add a venue, and run your first scrape.
      </p>
    </div>
  );
}
