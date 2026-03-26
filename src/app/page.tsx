'use client';
import { useEffect, useState, useCallback } from 'react';
import StatCard from '@/components/StatCard';
import ScrapeButton from '@/components/ScrapeButton';
import Link from 'next/link';

interface Band {
  artist: string;
  soldOutCount: number;
  totalShows: number;
  selloutRate: number;
}

interface Stats {
  totalEvents: number;
  soldOutEvents: number;
  totalVenues: number;
  selloutRate: number;
  recentRuns: Array<{
    id: number;
    status: string;
    eventsFound: number;
    soldOutFound: number;
    createdAt: string;
    venue: { name: string };
  }>;
}

export default function Dashboard() {
  const [bands, setBands] = useState<Band[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [bandsRes, statsRes] = await Promise.all([
      fetch('/api/bands'),
      fetch('/api/stats'),
    ]);
    setBands(await bandsRes.json());
    setStats(await statsRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const hotBands = bands.filter((b) => b.selloutRate >= 75);
  const rising = bands.filter((b) => b.selloutRate >= 50 && b.selloutRate < 75);

  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <h1 className="font-display text-6xl text-white mb-2">
          SELLOUT<span className="text-[#4d65ff]"> INTELLIGENCE</span>
        </h1>
        <p className="text-[#555] text-sm max-w-xl">
          Weekly tracking of which artists are selling out venues. Powered by live scrapes from
          venue websites — helping talent buyers, managers, and bookers spot momentum early.
        </p>
      </div>

      {/* Stats row */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-3 w-20 bg-[#1e1e1e] rounded mb-3" />
              <div className="h-8 w-16 bg-[#1e1e1e] rounded" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Venues Tracked" value={stats.totalVenues} />
          <StatCard label="Total Shows" value={stats.totalEvents} />
          <StatCard label="Sold Out" value={stats.soldOutEvents} accent />
          <StatCard
            label="Sellout Rate"
            value={`${stats.selloutRate}%`}
            sub="across all venues"
          />
        </div>
      ) : null}

      {/* Controls */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-[#888]">
          TOP ARTISTS BY SELLOUT COUNT
        </h2>
        <ScrapeButton onComplete={load} />
      </div>

      {/* Empty state */}
      {!loading && bands.length === 0 && (
        <div className="card p-12 text-center">
          <p className="font-display text-3xl text-[#333] mb-2">NO DATA YET</p>
          <p className="text-[#444] text-sm mb-6">
            Add a venue and run your first scrape to start tracking sellouts.
          </p>
          <Link href="/venues" className="btn-primary">Add a Venue</Link>
        </div>
      )}

      {/* Hot section */}
      {hotBands.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500 pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-red-400">On Fire — 75%+ Sellout Rate</span>
          </div>
          <BandTable bands={hotBands} hot />
        </div>
      )}

      {/* Rising section */}
      {rising.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#888]">Rising — 50–74% Sellout Rate</span>
          </div>
          <BandTable bands={rising} />
        </div>
      )}

      {/* All others */}
      {bands.filter((b) => b.selloutRate < 50).length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#555]">All Tracked Artists</span>
          </div>
          <BandTable bands={bands.filter((b) => b.selloutRate < 50)} startRank={hotBands.length + rising.length + 1} />
        </div>
      )}

      {/* Recent scrapes */}
      {stats && stats.recentRuns.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-[#444] mb-3">RECENT SCRAPE RUNS</h2>
          <div className="card overflow-hidden">
            <table>
              <thead>
                <tr>
                  <th>Venue</th>
                  <th>Status</th>
                  <th>Events</th>
                  <th>Sold Out</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentRuns.map((r) => (
                  <tr key={r.id}>
                    <td className="text-white font-medium">{r.venue.name}</td>
                    <td>
                      <span className={`text-xs font-bold uppercase tracking-wide ${
                        r.status === 'success' ? 'text-green-400' : 'text-red-400'
                      }`}>{r.status}</span>
                    </td>
                    <td>{r.eventsFound}</td>
                    <td className="text-[#4d65ff]">{r.soldOutFound}</td>
                    <td className="text-[#555] text-xs font-mono">
                      {new Date(r.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function BandTable({ bands, hot, startRank = 1 }: { bands: Band[]; hot?: boolean; startRank?: number }) {
  return (
    <div className="card overflow-hidden">
      <table>
        <thead>
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>Artist</th>
            <th>Sold Out Shows</th>
            <th>Total Shows</th>
            <th style={{ width: 200 }}>Sellout Rate</th>
          </tr>
        </thead>
        <tbody>
          {bands.map((band, i) => {
            const rank = startRank + i;
            return (
              <tr key={band.artist}>
                <td>
                  <span className={`rank-number ${rank <= 3 ? 'top' : ''}`}>{rank}</span>
                </td>
                <td>
                  <Link
                    href={`/events?artist=${encodeURIComponent(band.artist)}`}
                    className="text-white font-semibold hover:text-[#4d65ff] transition-colors"
                  >
                    {band.artist}
                  </Link>
                </td>
                <td>
                  <span className="text-[#4d65ff] font-bold">{band.soldOutCount}</span>
                </td>
                <td>{band.totalShows}</td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="bar flex-1">
                      <div
                        className={`bar-fill ${hot ? 'hot' : ''}`}
                        style={{ width: `${band.selloutRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-[#888] w-10 text-right">
                      {band.selloutRate}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
