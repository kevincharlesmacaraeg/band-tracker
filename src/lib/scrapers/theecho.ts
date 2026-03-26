import { chromium, Browser, Page } from 'playwright';

export interface ScrapedEvent {
  artist: string;
  date: Date;
  soldOut: boolean;
  ticketUrl?: string;
}

interface RawEvent {
  artist: string;
  dateStr: string;
  soldOut: boolean;
  ticketUrl: string;
}

async function parseEvents(page: Page): Promise<RawEvent[]> {
  return page.evaluate(() => {
    const results: Array<{ artist: string; dateStr: string; soldOut: boolean; ticketUrl: string }> = [];

    // The Echo / Echoplex event cards
    const cards = document.querySelectorAll(
      '[class*="EventCard"], [class*="event-card"], [class*="show-item"], article'
    );

    cards.forEach((card) => {
      const artistEl =
        card.querySelector('h2, h3, h4, [class*="title"], [class*="artist"], [class*="name"]');
      const dateEl =
        card.querySelector('time, [class*="date"], [class*="Date"], [datetime]');
      const soldOutEl =
        card.querySelector('[class*="sold"], [class*="Sold"]');

      const text = card.textContent?.toLowerCase() ?? '';
      const soldOut =
        soldOutEl !== null ||
        text.includes('sold out') ||
        text.includes('sold-out');

      const ticketLink =
        (card.querySelector('a[href*="ticket"], a[href*="bit.ly"], a[href*="etix"]') as HTMLAnchorElement | null)
          ?.href ?? '';

      const artist = artistEl?.textContent?.trim() ?? '';
      const dateStr =
        (dateEl as HTMLTimeElement | null)?.dateTime ??
        dateEl?.textContent?.trim() ??
        '';

      if (artist) {
        results.push({ artist, dateStr, soldOut, ticketUrl: ticketLink });
      }
    });

    return results;
  });
}

export async function scrapeTheEcho(): Promise<ScrapedEvent[]> {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    await page.goto('https://www.theecho.com/shows', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    // Wait for event content
    await page
      .waitForSelector('[class*="Event"], [class*="event"], article', { timeout: 15000 })
      .catch(() => null);

    // Scroll to trigger lazy-load
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const raw = await parseEvents(page);

    return raw
      .map((e) => {
        let date: Date;
        try {
          date = new Date(e.dateStr);
          if (isNaN(date.getTime())) date = new Date();
        } catch {
          date = new Date();
        }
        return {
          artist: e.artist,
          date,
          soldOut: e.soldOut,
          ticketUrl: e.ticketUrl || undefined,
        };
      })
      .filter((e) => e.artist.length > 0);
  } finally {
    await browser?.close();
  }
}

// Scraper registry — add new venues here
export type ScraperFn = () => Promise<ScrapedEvent[]>;

export const SCRAPERS: Record<string, ScraperFn> = {
  'https://www.theecho.com': scrapeTheEcho,
};
