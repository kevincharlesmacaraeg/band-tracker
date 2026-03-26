import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const venues = await prisma.venue.findMany({
    include: {
      _count: { select: { events: true, scrapeRuns: true } },
      scrapeRuns: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(venues);
}

export async function POST(req: NextRequest) {
  const { name, url, city } = await req.json();
  if (!name || !url) {
    return NextResponse.json({ error: 'name and url required' }, { status: 400 });
  }
  const venue = await prisma.venue.create({ data: { name, url, city } });
  return NextResponse.json(venue, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  await prisma.venue.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
