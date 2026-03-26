'use client';
import { useState } from 'react';

interface Props {
  venueId?: number;
  onComplete?: () => void;
}

const scrapeEnabled = process.env.NEXT_PUBLIC_SCRAPE_ENABLED === 'true';

export default function ScrapeButton({ venueId, onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  if (!scrapeEnabled) {
    return (
      <div className="text-xs text-[#444] font-mono border border-[#222] rounded px-3 py-2">
        Run <span className="text-[#4d65ff]">npm run scrape</span> locally to update data
      </div>
    );
  }

  async function handleScrape() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venueId ? { venueId } : {}),
      });
      const data = await res.json();
      if (data.error) {
        setResult(`Error: ${data.error}`);
      } else if (Array.isArray(data)) {
        const total = data.reduce((s: number, r: { eventsFound: number }) => s + r.eventsFound, 0);
        const sold = data.reduce((s: number, r: { soldOutFound: number }) => s + r.soldOutFound, 0);
        setResult(`Found ${total} events, ${sold} sold out`);
      } else {
        setResult(`Found ${data.eventsFound} events, ${data.soldOutFound} sold out`);
      }
      onComplete?.();
    } catch {
      setResult('Failed to run scrape');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button className="btn-primary" onClick={handleScrape} disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            Scraping...
          </span>
        ) : (
          venueId ? 'Scrape Now' : 'Scrape All Venues'
        )}
      </button>
      {result && (
        <span className={`text-sm ${result.startsWith('Error') ? 'text-red-400' : 'text-[#4d65ff]'}`}>
          {result}
        </span>
      )}
    </div>
  );
}
