export type Interval = '1d' | '1wk' | '1mo' | '15m';

export interface Quote {
  symbol: string;
  price: number;
  changePct: number;
  ts: number;
  name?: string;
}

export interface OHLC {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
}

export interface MarketDataProvider {
  quote(symbols: string[]): Promise<Quote[]>;
  ohlc(symbol: string, interval: Interval, from?: string, to?: string): Promise<OHLC[]>;
  search(q: string): Promise<SearchResult[]>;
}
