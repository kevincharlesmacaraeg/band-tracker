/**
 * Standalone scrape script — run with: npm run scrape
 * Useful for cron jobs or manual CLI runs without starting the Next.js server.
 */
import { runAllScrapes } from '../lib/scrapeRunner';

async function main() {
  console.log('Starting scrape run...\n');
  const results = await runAllScrapes();
  for (const r of results) {
    const icon = r.status === 'success' ? '✓' : '✗';
    console.log(`${icon} ${r.venue}`);
    if (r.status === 'success') {
      console.log(`  Events: ${r.eventsFound}  Sold out: ${r.soldOutFound}`);
    } else {
      console.log(`  Error: ${r.error}`);
    }
  }
  console.log('\nDone.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
