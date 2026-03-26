import { prisma } from './db';
import { SCRAPERS } from './scrapers/theecho';

export async function runScrapeForVenue(venueId: number) {
  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue) throw new Error(`Venue ${venueId} not found`);

  // Match URL to scraper (strip trailing slash)
  const key = venue.url.replace(/\/$/, '');
  const scraper = SCRAPERS[key];
  if (!scraper) throw new Error(`No scraper registered for ${venue.url}`);

  let status = 'success';
  let error: string | undefined;
  let eventsFound = 0;
  let soldOutFound = 0;

  try {
    const events = await scraper();
    eventsFound = events.length;
    soldOutFound = events.filter((e) => e.soldOut).length;

    // Upsert events
    for (const e of events) {
      await prisma.event.upsert({
        where: {
          venueId_artist_date: {
            venueId: venue.id,
            artist: e.artist,
            date: e.date,
          },
        },
        update: {
          soldOut: e.soldOut,
          price: e.price ?? null,
          ticketUrl: e.ticketUrl,
          scrapedAt: new Date(),
        },
        create: {
          venueId: venue.id,
          artist: e.artist,
          date: e.date,
          soldOut: e.soldOut,
          price: e.price ?? null,
          ticketUrl: e.ticketUrl,
        },
      });
    }
  } catch (err: unknown) {
    status = 'error';
    error = err instanceof Error ? err.message : String(err);
  }

  await prisma.scrapeRun.create({
    data: { venueId: venue.id, status, eventsFound, soldOutFound, error },
  });

  return { status, eventsFound, soldOutFound, error };
}

export async function runAllScrapes() {
  const venues = await prisma.venue.findMany({ where: { active: true } });
  const results = [];
  for (const venue of venues) {
    const result = await runScrapeForVenue(venue.id);
    results.push({ venue: venue.name, ...result });
  }
  return results;
}
