import { tryProviders } from './fallback';
import { StooqProvider } from './providers/stooq';
import { YahooProvider } from './providers/yahoo';
import { Interval, MarketDataProvider } from './types';

class YahooStooqProvider implements MarketDataProvider {
  private readonly yahoo = new YahooProvider();
  private readonly stooq = new StooqProvider();

  quote(symbols: string[]) {
    return tryProviders(
      [
        () => this.yahoo.quote(symbols),
        () => this.stooq.quote(symbols)
      ],
      (data) => Array.isArray(data) && data.length > 0
    );
  }

  ohlc(symbol: string, interval: Interval, from?: string, to?: string) {
    return tryProviders(
      [
        () => this.yahoo.ohlc(symbol, interval, from, to),
        () => this.stooq.ohlc(symbol, interval, from, to)
      ],
      (data) => Array.isArray(data) && data.length > 0
    );
  }

  search(q: string) {
    return tryProviders(
      [
        () => this.yahoo.search(q),
        () => this.stooq.search(q)
      ],
      (data) => Array.isArray(data)
    );
  }
}

export function getProvider(): MarketDataProvider {
  return new YahooStooqProvider();
}
