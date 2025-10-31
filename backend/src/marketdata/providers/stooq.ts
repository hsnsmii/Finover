import { Interval, MarketDataProvider, OHLC, Quote, SearchResult } from '../types';
import { normBar, normQuote } from '../normalize';

const parseCsv = (csv: string): string[][] =>
  csv
    .trim()
    .split('\n')
    .map((line) => line.split(',').map((part) => part.trim()));

const fetchText = async (url: string): Promise<string> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FinoverBot/1.0)'
    }
  });

  if (!response.ok) {
    throw new Error(`Stooq request failed (${response.status})`);
  }

  return await response.text();
};

export class StooqProvider implements MarketDataProvider {
  async quote(symbols: string[]): Promise<Quote[]> {
    const results: Quote[] = [];

    for (const symbol of symbols) {
      const csv = await fetchText(
        `https://stooq.com/q/l/?s=${encodeURIComponent(symbol.toLowerCase())}&f=sd2t2ohlcv&h&e=csv`
      );
      const [, row] = csv.split('\n');
      if (!row) {
        continue;
      }
      const [code, date, time, open, high, low, close] = row.split(',');
      if (!code || close === 'N/A') {
        continue;
      }
      results.push(
        normQuote({
          symbol,
          price: Number(close),
          change_p: 0,
          timestamp: date && time ? Date.parse(`${date}T${time}`) / 1000 : Date.now() / 1000
        })
      );
    }

    return results;
  }

  async ohlc(symbol: string, _interval: Interval, _from?: string, _to?: string): Promise<OHLC[]> {
    const csv = await fetchText(
      `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol.toLowerCase())}&i=d`
    );
    const rows = parseCsv(csv).slice(1); // skip header

    return rows
      .filter((row) => row.length >= 6 && row[0] !== 'N/A')
      .map(([date, open, high, low, close, volume]) =>
        normBar({
          date,
          open,
          high,
          low,
          close,
          volume
        })
      );
  }

  // Stooq does not have a public search endpoint we can use freely;
  // return an empty array so that Yahoo provider handles search.
  async search(_q: string): Promise<SearchResult[]> {
    return [];
  }
}
