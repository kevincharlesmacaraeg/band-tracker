import { scrapeChakraVenue } from './chakraVenue';
import type { ScrapedEvent } from './types';

export async function scrapeWiltern(): Promise<ScrapedEvent[]> {
  return scrapeChakraVenue('https://www.wiltern.com/shows/');
}
