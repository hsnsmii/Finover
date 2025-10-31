import { getProvider } from './index';
import { Quote } from './types';

const SUMMARY_BASE = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary';

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; FinoverBot/1.0)'
    }
  });

  if (!response.ok) {
    throw new Error(`Yahoo summary request failed (${response.status})`);
  }

  return (await response.json()) as T;
};

export const getCompanyProfile = async (symbol: string) => {
  const modules = ['price', 'summaryProfile', 'financialData'];
  const url = `${SUMMARY_BASE}/${encodeURIComponent(symbol)}?modules=${modules.join(',')}`;
  const json = await fetchJson<{
    quoteSummary?: {
      result?: Array<{
        price?: Record<string, any>;
        summaryProfile?: Record<string, any>;
        financialData?: Record<string, any>;
      }>;
    };
  }>(url);

  const result = json?.quoteSummary?.result?.[0];
  if (!result) {
    return [];
  }

  const price = result.price ?? {};
  const summaryProfile = result.summaryProfile ?? {};
  const financialData = result.financialData ?? {};

  return [
    {
      symbol,
      price: price.regularMarketPrice?.raw ?? null,
      beta: financialData.beta?.raw ?? null,
      companyName: price.shortName ?? price.longName ?? symbol,
      exchange: price.exchangeName ?? price.exchange ?? null,
      exchangeShortName: price.exchange ?? null,
      currency: price.currency ?? null,
      website: summaryProfile.website ?? null,
      description: summaryProfile.longBusinessSummary ?? null,
      sector: summaryProfile.sector ?? null,
      industry: summaryProfile.industry ?? null,
      ceo: summaryProfile.companyOfficers?.[0]?.name ?? null,
      country: summaryProfile.country ?? null,
      mktCap: price.marketCap?.raw ?? null,
      changesPercentage: price.regularMarketChangePercent?.raw ?? null
    }
  ];
};

export const getIncomeStatements = async (symbol: string) => {
  const modules = ['incomeStatementHistory'];
  const url = `${SUMMARY_BASE}/${encodeURIComponent(symbol)}?modules=${modules.join(',')}`;
  const json = await fetchJson<{
    quoteSummary?: {
      result?: Array<{
        incomeStatementHistory?: {
          incomeStatementHistory?: Array<Record<string, any>>;
        };
      }>;
    };
  }>(url);

  const statements =
    json?.quoteSummary?.result?.[0]?.incomeStatementHistory?.incomeStatementHistory ?? [];

  return statements.map((statement) => ({
    date: statement.endDate?.fmt ?? statement.endDate?.raw ?? null,
    revenue: statement.totalRevenue?.raw ?? null,
    netIncome: statement.netIncome?.raw ?? null,
    eps: statement.basicEPS?.raw ?? statement.dilutedEPS?.raw ?? null
  }));
};

export const getFxQuote = async (pair: string) => {
  const provider = getProvider();
  const yahooPair = `${pair.toUpperCase()}=X`;
  const quotes = await provider.quote([yahooPair]);

  if (!quotes.length) {
    return [];
  }

  const fxQuote = quotes[0];

  return [
    {
      symbol: pair.toUpperCase(),
      price: fxQuote.price,
      bid: fxQuote.price,
      ask: fxQuote.price,
      timestamp: fxQuote.ts
    }
  ];
};

export const mapQuotesToFmpShape = (quotes: Quote[]) =>
  quotes.map((quote) => ({
    symbol: quote.symbol,
    name: quote.name ?? quote.symbol,
    price: quote.price,
    change: quote.changePct,
    changesPercentage: quote.changePct
  }));
