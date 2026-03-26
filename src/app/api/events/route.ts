import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const artist = searchParams.get('artist');
  const soldOutOnly = searchParams.get('soldOut') === 'true';

  const events = await prisma.event.findMany({
    where: {
      ...(artist ? { artist: { contains: artist } } : {}),
      ...(soldOutOnly ? { soldOut: true } : {}),
    },
    include: { venue: { select: { name: true, city: true } } },
    orderBy: { date: 'desc' },
    take: 200,
  });

  return NextResponse.json(events);
}
