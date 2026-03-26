import { NextRequest, NextResponse } from 'next/server';
import { runScrapeForVenue, runAllScrapes } from '@/lib/scrapeRunner';

export async function POST(req: NextRequest) {
  if (process.env.SCRAPE_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'Scraping is disabled on this deployment. Run `npm run scrape` locally.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const venueId = body?.venueId;

    if (venueId) {
      const result = await runScrapeForVenue(Number(venueId));
      return NextResponse.json(result);
    } else {
      const results = await runAllScrapes();
      return NextResponse.json(results);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
