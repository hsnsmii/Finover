import { Interval, MarketDataProvider, OHLC, Quote, SearchResult } from '../types';
import { normBar, normQuote } from '../normalize';

const YAHOO_BASE = 'https://query1.finance.yahoo.com';

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FinoverBot/1.0)'
    }
  });

  if (!response.ok) {
    throw new Error(`Yahoo request failed (${response.status})`);
  }

  return (await response.json()) as T;
};

export class YahooProvider implements MarketDataProvider {
  async quote(symbols: string[]): Promise<Quote[]> {
    if (symbols.length === 0) {
      return [];
    }

    const url = `${YAHOO_BASE}/v7/finance/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
    const json = await fetchJson<{ quoteResponse?: { result?: Array<Record<string, unknown>> } }>(url);
    const items = json?.quoteResponse?.result ?? [];

    return items
      .filter((item) => item && item.symbol)
      .map((item) =>
        normQuote({
          symbol: item.symbol,
          price: item.regularMarketPrice,
          regularMarketChangePercent: item.regularMarketChangePercent,
          timestamp: item.regularMarketTime,
          name: item.shortName ?? item.longName
        })
      );
  }

  async ohlc(symbol: string, interval: Interval, from?: string, to?: string): Promise<OHLC[]> {
    const params = new URLSearchParams({
      range: this.resolveRange(interval, from, to),
      interval
    });

    params.set('includePrePost', 'false');
    params.set('events', 'div,split');

    const url = `${YAHOO_BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?${params.toString()}`;

    const json = await fetchJson<{
      chart?: {
        result?: Array<{
          timestamp?: number[];
          indicators?: { quote?: Array<Record<string, number[]>> };
        }>;
      };
    }>(url);

    const result = json?.chart?.result?.[0];

    if (!result?.timestamp || !result.indicators?.quote?.[0]) {
      return [];
    }

    const quote = result.indicators.quote[0];

    return result.timestamp.map((sec, index) =>
      normBar({
        t: sec,
        o: quote.open?.[index],
        h: quote.high?.[index],
        l: quote.low?.[index],
        c: quote.close?.[index],
        v: quote.volume?.[index]
      })
    );
  }

  async search(q: string): Promise<SearchResult[]> {
    if (!q.trim()) {
      return [];
    }

    const url = `${YAHOO_BASE}/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=10&newsCount=0`;
    const json = await fetchJson<{ quotes?: Array<Record<string, unknown>> }>(url);

    return (json?.quotes ?? [])
      .filter((quote) => quote?.symbol)
      .map((quote) => ({
        symbol: String(quote.symbol),
        name: String(quote.shortname ?? quote.longname ?? quote.symbol)
      }));
  }

  private resolveRange(interval: Interval, from?: string, to?: string): string {
    if (from && to) {
      const fromDate = new Date(from);
      const toDate = new Date(to);
      const ms = Math.abs(toDate.getTime() - fromDate.getTime());
      const days = ms / (1000 * 60 * 60 * 24);

      if (!Number.isNaN(days) && Number.isFinite(days)) {
        if (days <= 7) return '5d';
        if (days <= 31) return '1mo';
        if (days <= 180) return '6mo';
        if (days <= 365) return '1y';
        if (days <= 365 * 2) return '2y';
        if (days <= 365 * 5) return '5y';
        return '10y';
      }
    }

    switch (interval) {
      case '15m':
        return '5d';
      case '1wk':
        return '5y';
      case '1mo':
        return '10y';
      default:
        return '2y';
    }
  }
}
