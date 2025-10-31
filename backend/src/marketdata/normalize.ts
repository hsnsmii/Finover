import { OHLC, Quote } from './types';

export const normQuote = (value: Record<string, unknown>): Quote => {
  const timestamp =
    typeof value.timestamp === 'number'
      ? value.timestamp * (value.timestamp > 10_000_000_000 ? 1 : 1000)
      : Date.now();

  return {
    symbol: String(value.symbol ?? value.code ?? ''),
    price: Number(
      value.price ??
        value.regularMarketPrice ??
        value.close ??
        value.c ??
        value.last ??
        0
    ),
    changePct: Number(
      value.changePct ??
        value.changePercent ??
        value.regularMarketChangePercent ??
        value.change_p ??
        value.dp ??
        0
    ),
    ts: Number(timestamp),
    name: typeof value.name === 'string' ? value.name : undefined
  };
};

export const normBar = (value: Record<string, unknown>): OHLC => {
  const tsCandidate =
    value.t ??
    (typeof value.timestamp === 'number' ? value.timestamp : undefined) ??
    (value.date ? Date.parse(String(value.date)) : undefined) ??
    (value.datetime ? Date.parse(String(value.datetime)) : undefined);

  const toNumber = (input: unknown): number =>
    Number(
      input ?? 0
    );

  return {
    t: typeof tsCandidate === 'number' ? (tsCandidate > 10_000_000_000 ? tsCandidate : tsCandidate * 1000) : Date.now(),
    o: toNumber(value.o ?? value.open),
    h: toNumber(value.h ?? value.high),
    l: toNumber(value.l ?? value.low),
    c: toNumber(value.c ?? value.close ?? value.adjclose),
    v: toNumber(value.v ?? value.volume ?? 0)
  };
};
