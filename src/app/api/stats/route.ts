export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const [totalEvents, soldOutEvents, totalVenues, recentRuns] = await Promise.all([
    prisma.event.count(),
    prisma.event.count({ where: { soldOut: true } }),
    prisma.venue.count({ where: { active: true } }),
    prisma.scrapeRun.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { venue: { select: { name: true } } },
    }),
  ]);

  return NextResponse.json({
    totalEvents,
    soldOutEvents,
    totalVenues,
    selloutRate: totalEvents > 0 ? Math.round((soldOutEvents / totalEvents) * 100) : 0,
    recentRuns,
  });
}
