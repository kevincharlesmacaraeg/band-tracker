import { scrapeTheEcho } from './theecho';
import { scrapeWiltern } from './wiltern';
import type { ScraperFn } from './types';

export type { ScrapedEvent, ScraperFn } from './types';

export const SCRAPERS: Record<string, ScraperFn> = {
  'https://www.theecho.com': scrapeTheEcho,
  'https://www.wiltern.com': scrapeWiltern,
};
