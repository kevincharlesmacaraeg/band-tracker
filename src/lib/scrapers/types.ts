export interface ScrapedEvent {
  artist: string;
  date: Date;
  soldOut: boolean;
  price?: string;
  ticketUrl?: string;
}

export type ScraperFn = () => Promise<ScrapedEvent[]>;
