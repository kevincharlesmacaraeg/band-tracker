'use client';
import { useState } from 'react';

interface Props {
  venueId?: number;
  onComplete?: () => void;
}

export default function ScrapeButton({ venueId, onComplete }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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
      if (Array.isArray(data)) {
        const total = data.reduce((s: number, r: { eventsFound: number }) => s + r.eventsFound, 0);
        const sold = data.reduce((s: number, r: { soldOutFound: number }) => s + r.soldOutFound, 0);
        setResult(`Found ${total} events, ${sold} sold out`);
      } else if (data.error) {
        setResult(`Error: ${data.error}`);
      } else {
        setResult(`Found ${data.eventsFound} events, ${data.soldOutFound} sold out`);
      }
      onComplete?.();
    } catch (e) {
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
