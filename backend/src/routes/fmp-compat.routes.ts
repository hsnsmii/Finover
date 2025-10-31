import { Router } from 'express';
import { getProvider } from '../marketdata';
import { getCompanyProfile, getFxQuote, getIncomeStatements, mapQuotesToFmpShape } from '../marketdata/extras';

const router = Router();
const marketProvider = getProvider();

const decodeValue = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const fetchNewsFromYahoo = async (query: string, limit: number) => {
  const searchQuery = query || 'stock market';
  const params = new URLSearchParams({
    q: searchQuery,
    quotesCount: '0',
    newsCount: String(Math.max(1, Math.min(limit, 20))),
    enableFuzzyQuery: 'false',
    quotesQueryId: 'tss_match_phrase_query',
    multiQuoteQueryId: 'multi_quote_single_token_query',
    newsQueryId: 'news_v2'
  });

  const response = await fetch(`https://query1.finance.yahoo.com/v1/finance/search?${params.toString()}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FinoverBot/1.0)'
    }
  });

  if (!response.ok) {
    throw new Error(`Yahoo news request failed (${response.status})`);
  }

  const json = (await response.json()) as { news?: Array<Record<string, any>> };
  const articles = json.news ?? [];

  return articles.map((article) => {
    const thumbnail = article.thumbnail?.resolutions?.[0]?.url ?? null;
    const timestamp =
      typeof article.providerPublishTime === 'number'
        ? article.providerPublishTime * 1000
        : typeof article.published_at === 'number'
          ? article.published_at * 1000
          : Date.now();

    return {
      title: article.title ?? '',
      text: article.summary ?? '',
      site: article.publisher ?? '',
      url: article.link ?? article.clickThroughUrl ?? '',
      image: thumbnail,
      publishedDate: new Date(timestamp).toISOString()
    };
  });
};

const extractSymbols = (req: any): string[] => {
  const raw =
    req.params?.symbols ??
    req.query?.symbols ??
    req.query?.symbol ??
    req.params?.symbol ??
    '';
  const decoded = decodeValue(raw);

  return decoded
    .split(',')
    .map((symbol) => symbol.trim())
    .filter(Boolean);
};

router.get('/v3/quote/:symbols?', async (req, res, next) => {
  try {
    const symbols = extractSymbols(req);

    if (!symbols.length) {
      return res.status(400).json({ error: 'symbols required' });
    }

    const quotes = await marketProvider.quote(symbols);
    res.json(mapQuotesToFmpShape(quotes));
  } catch (error) {
    next(error);
  }
});

router.get('/v3/search', async (req, res, next) => {
  try {
    const query = String(req.query.query || req.query.q || '').trim();
    if (!query) {
      return res.json([]);
    }
    const results = await marketProvider.search(query);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

router.get('/v3/profile/:symbol', async (req, res, next) => {
  try {
    const symbol = decodeValue(req.params.symbol).trim();
    if (!symbol) {
      return res.status(400).json({ error: 'symbol required' });
    }
    const profile = await getCompanyProfile(symbol);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

router.get('/v3/income-statement/:symbol', async (req, res, next) => {
  try {
    const symbol = decodeValue(req.params.symbol).trim();
    if (!symbol) {
      return res.status(400).json({ error: 'symbol required' });
    }
    const statements = await getIncomeStatements(symbol);
    res.json(statements);
  } catch (error) {
    next(error);
  }
});

router.get('/v3/fx/:pair', async (req, res, next) => {
  try {
    const pair = decodeValue(req.params.pair || '').replace(/=x$/i, '').trim();
    if (!pair) {
      return res.status(400).json({ error: 'pair required' });
    }
    const quotes = await getFxQuote(pair);
    res.json(quotes);
  } catch (error) {
    next(error);
  }
});

router.get('/v3/historical-price-full/:symbol', async (req, res, next) => {
  try {
    const symbol = decodeValue(req.params.symbol || '').trim();
    if (!symbol) {
      return res.status(400).json({ error: 'symbol required' });
    }

    const from = typeof req.query.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query.to === 'string' ? req.query.to : undefined;
    const timeseries = Number(req.query.timeseries);

    const candles = await marketProvider.ohlc(symbol, '1d', from, to);
    const limited = Number.isFinite(timeseries) && timeseries > 0 ? candles.slice(-timeseries) : candles;

    const historical = limited.map((bar) => {
      const date = new Date(bar.t);
      return {
        date: date.toISOString().split('T')[0],
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        adjClose: bar.c,
        volume: bar.v
      };
    });

    res.json({ symbol, historical });
  } catch (error) {
    next(error);
  }
});

router.get('/v3/historical-chart/15min/:symbol', async (req, res, next) => {
  try {
    const symbol = decodeValue(req.params.symbol || '').trim();
    if (!symbol) {
      return res.status(400).json({ error: 'symbol required' });
    }

    const bars = await marketProvider.ohlc(symbol, '15m');

    const historical = bars.map((bar) => {
      const date = new Date(bar.t);
      const formatted = `${date.toISOString().split('T')[0]} ${date.toISOString().split('T')[1].split('.')[0]}`;
      return {
        date: formatted,
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v
      };
    });

    res.json(historical);
  } catch (error) {
    next(error);
  }
});

router.get('/v3/stock_news', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const tickers = typeof req.query.tickers === 'string' ? req.query.tickers : '';
    const news = await fetchNewsFromYahoo(tickers, limit);
    res.json(news.slice(0, limit));
  } catch (error) {
    next(error);
  }
});

export const fmpCompatRouter = router;
