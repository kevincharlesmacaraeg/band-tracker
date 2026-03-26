import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  // Aggregate sellout counts per artist across all venues
  const soldOutEvents = await prisma.event.groupBy({
    by: ['artist'],
    where: { soldOut: true },
    _count: { artist: true },
    orderBy: { _count: { artist: 'desc' } },
  });

  const totalEvents = await prisma.event.groupBy({
    by: ['artist'],
    _count: { artist: true },
  });

  const totalMap = new Map(totalEvents.map((e) => [e.artist, e._count.artist]));

  const bands = soldOutEvents.map((e) => ({
    artist: e.artist,
    soldOutCount: e._count.artist,
    totalShows: totalMap.get(e.artist) ?? e._count.artist,
    selloutRate: Math.round(
      (e._count.artist / (totalMap.get(e.artist) ?? e._count.artist)) * 100
    ),
  }));

  return NextResponse.json(bands);
}
