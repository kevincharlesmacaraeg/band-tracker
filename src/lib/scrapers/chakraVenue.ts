/**
 * Generic scraper for venues built on Chakra UI (The Echo, The Wiltern, etc.)
 * These sites share identical card structure: .chakra-card with p.chakra-text
 * elements for artist/date and a.chakra-button for the ticket link.
 */
import { chromium, Browser, BrowserContext } from 'playwright';
import type { ScrapedEvent } from './types';

async function fetchTicketmasterPrice(
  browser: Browser,
  url: string
): Promise<string | undefined> {
  let ctx: BrowserContext | null = null;
  try {
    ctx = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'en-US',
    });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    return await page.evaluate(() => {
      const text = document.documentElement?.innerText ?? '';
      const matches = text.match(/\$[\d,]+(\.\d{2})?/g);
      if (!matches) return undefined;
      const nums = matches.map((p) => parseFloat(p.replace(/[$,]/g, ''))).filter((n) => n > 1);
      const min = Math.min(...nums);
      return isFinite(min) ? `$${min.toFixed(2)}` : undefined;
    });
  } catch {
    return undefined;
  } finally {
    await ctx?.close();
  }
}

export async function scrapeChakraVenue(showsUrl: string): Promise<ScrapedEvent[]> {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();

    await page.goto(showsUrl, { waitUntil: 'networkidle', timeout: 30000 });

    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(800);
    }

    const raw = await page.evaluate(() => {
      const results: Array<{ artist: string; dateStr: string; soldOut: boolean; ticketUrl: string }> = [];
      document.querySelectorAll('.chakra-card').forEach((card) => {
        const text = card.textContent ?? '';
        const soldOut = text.toLowerCase().includes('sold out');

        const ps = Array.from(card.querySelectorAll('p.chakra-text'));
        let artist = ps[0]?.textContent?.trim() ?? '';
        artist = artist.replace(/\s*[-–]\s*sold out\s*$/i, '').trim();

        const dateStr = ps[1]?.textContent?.trim() ?? '';
        const ticketUrl =
          (card.querySelector('a.chakra-button') as HTMLAnchorElement | null)?.href ?? '';

        if (artist) results.push({ artist, dateStr, soldOut, ticketUrl });
      });
      return results;
    });

    const events: ScrapedEvent[] = raw
      .map((e) => ({
        artist: e.artist,
        date: e.dateStr ? new Date(e.dateStr) : new Date(),
        soldOut: e.soldOut,
        ticketUrl: e.ticketUrl || undefined,
      }))
      .filter((e) => e.artist.length > 0 && !isNaN(e.date.getTime()));

    // Fetch Ticketmaster prices for sold-out shows (parallel batches of 3)
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
