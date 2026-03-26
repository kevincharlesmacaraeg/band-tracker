import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const venues = [
    { name: 'The Echo / Echoplex', url: 'https://www.theecho.com', city: 'Los Angeles, CA' },
  ];

  for (const v of venues) {
    await prisma.venue.upsert({
      where: { url: v.url },
      update: {},
      create: v,
    });
    console.log(`Seeded: ${v.name}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
