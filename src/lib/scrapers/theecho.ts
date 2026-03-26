import { scrapeChakraVenue } from './chakraVenue';
import type { ScrapedEvent } from './types';

export async function scrapeTheEcho(): Promise<ScrapedEvent[]> {
  return scrapeChakraVenue('https://www.theecho.com/shows');
}
