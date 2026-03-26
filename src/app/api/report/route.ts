import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export interface SoldOutShow {
  id: number;
  artist: string;
  date: string;
  price: string | null;
  ticketUrl: string | null;
}

export interface MonthGroup {
  month: string; // "April 2026"
  shows: SoldOutShow[];
}

export interface VenueReport {
  id: number;
  name: string;
  city: string | null;
  months: MonthGroup[];
  totalSoldOut: number;
}

export async function GET() {
  const venues = await prisma.venue.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
  });

  const reports: VenueReport[] = [];

  for (const venue of venues) {
    const soldOutEvents = await prisma.event.findMany({
      where: { venueId: venue.id, soldOut: true },
      orderBy: { date: 'asc' },
    });

    // Group by month
    const monthMap = new Map<string, SoldOutShow[]>();
    for (const e of soldOutEvents) {
      const d = new Date(e.date);
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!monthMap.has(label)) monthMap.set(label, []);
      monthMap.get(label)!.push({
        id: e.id,
        artist: e.artist,
        date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        price: e.price,
        ticketUrl: e.ticketUrl,
      });
    }

    // Sort shows within each month by price desc (nulls last)
    for (const shows of monthMap.values()) {
      shows.sort((a, b) => {
        const pa = a.price ? parseFloat(a.price.replace(/[$,]/g, '')) : 0;
        const pb = b.price ? parseFloat(b.price.replace(/[$,]/g, '')) : 0;
        return pb - pa;
      });
    }

    reports.push({
      id: venue.id,
      name: venue.name,
      city: venue.city,
      months: Array.from(monthMap.entries()).map(([month, shows]) => ({ month, shows })),
      totalSoldOut: soldOutEvents.length,
    });
  }

  return NextResponse.json(reports);
}
