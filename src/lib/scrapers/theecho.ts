import { chromium, Browser, Page } from 'playwright';

export interface ScrapedEvent {
  artist: string;
  date: Date;
  soldOut: boolean;
  price?: string;
  ticketUrl?: string;
}

interface RawEvent {
  artist: string;
  dateStr: string; // "Fri Mar 27, 2026"
  soldOut: boolean;
  ticketUrl: string;
}

async function fetchTicketmasterPrice(
  browser: Browser,
  url: string
): Promise<string | undefined> {
  const ctx = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    const price = await page.evaluate(() => {
      const body = document.documentElement?.innerText ?? '';
      const matches = body.match(/\$[\d,]+(\.\d{2})?/g);
      if (!matches) return null;
      const nums = matches.map((p) => parseFloat(p.replace(/[$,]/g, '')));
      const min = Math.min(...nums.filter((n) => n > 1));
      return isFinite(min) ? `$${min.toFixed(2)}` : null;
    });

    return price ?? undefined;
  } catch {
    return undefined;
  } finally {
    await ctx.close();
  }
}

async function parseEchoEvents(page: Page): Promise<RawEvent[]> {
  return page.evaluate(() => {
    const results: Array<{ artist: string; dateStr: string; soldOut: boolean; ticketUrl: string }> = [];
    const cards = document.querySelectorAll('.chakra-card');

    cards.forEach((card) => {
      const text = card.textContent ?? '';
      const soldOut = text.toLowerCase().includes('sold out');

      // Two <p class="chakra-text"> elements: [0] = artist, [1] = date
      const ps = Array.from(card.querySelectorAll('p.chakra-text'));
      let artist = ps[0]?.textContent?.trim() ?? '';
      artist = artist.replace(/\s*[-–]\s*sold out\s*$/i, '').trim();

      const dateStr = ps[1]?.textContent?.trim() ?? '';

      const ticketLink =
        (card.querySelector('a.chakra-button') as HTMLAnchorElement | null)?.href ?? '';

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
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();

    await page.goto('https://www.theecho.com/shows', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);
    }

    const raw = await parseEchoEvents(page);

    const events: ScrapedEvent[] = raw
      .map((e) => ({
        artist: e.artist,
        date: e.dateStr ? new Date(e.dateStr) : new Date(),
        soldOut: e.soldOut,
        ticketUrl: e.ticketUrl || undefined,
      }))
      .filter((e) => e.artist.length > 0 && !isNaN(e.date.getTime()));

    // Fetch prices for sold-out shows (best-effort, parallel batches of 3)
    const soldOut = events.filter((e) => e.soldOut && e.ticketUrl);
    for (let i = 0; i < soldOut.length; i += 3) {
      await Promise.all(
        soldOut.slice(i, i + 3).map(async (e) => {
          e.price = await fetchTicketmasterPrice(browser!, e.ticketUrl!);
        })
      );
    }

    return events;
  } finally {
    await browser?.close();
  }
}

export type ScraperFn = () => Promise<ScrapedEvent[]>;

export const SCRAPERS: Record<string, ScraperFn> = {
  'https://www.theecho.com': scrapeTheEcho,
};
