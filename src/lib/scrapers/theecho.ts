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

    // The Echo uses Chakra UI cards
    const cards = document.querySelectorAll('.chakra-card');

    cards.forEach((card) => {
      const text = card.textContent ?? '';
      const soldOut = text.toLowerCase().includes('sold out');

      // First meaningful text node / paragraph is the event title
      const titleEl = card.querySelector('p, h2, h3, h4');
      let artist = titleEl?.textContent?.trim() ?? '';
      // Strip " - SOLD OUT" suffix from title
      artist = artist.replace(/\s*[-–]\s*sold out\s*$/i, '').trim();

      // Date text like "Thu26Mar"
      const dateEl = card.querySelector('time, [class*="date"], [class*="Date"]');
      const dateStr = dateEl?.textContent?.trim() ?? '';

      const ticketLink =
        (card.querySelector('a[href*="ticketmaster"], a[href*="etix"], a[href*="dice"], a[href*="eventbrite"], a[href*="ticket"]') as HTMLAnchorElement | null)
          ?.href ?? '';

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
