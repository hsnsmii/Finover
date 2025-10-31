import { apiJson } from './http';

// Simple in-memory caches to avoid fetching the same data repeatedly
const detailCache = {};
const historyCache = {};

const SELECTED_SYMBOLS = [
  'AAPL',
  'AMZN',
  'BRK-B',
  'META',
  'MSFT',
  'NVDA',
  'TSLA',
  'GM',
  'FLNC',
  'RC',
  'APP',
  'VTRS',
  'GOOG',
  'GOOGL',
  'GTLL',
  'USO',
  'BNO',
  'OIH',
  'DBO',
  'OIL',
  'PXJ',
  'IEO',
  'UCO',
  'XOP',
  'GUSH',
  'TBBK',
  'SOUN',
  'NPWR',
  'BBAI',
  'TKKYY',
  'TKGBY'
];

const buildQuotePath = (symbols) => `/api/v3/quote?symbols=${encodeURIComponent(symbols.join(','))}`;

export const getSelectedStocks = async () => {
  try {
      const data = await apiJson(buildQuotePath(SELECTED_SYMBOLS));

    return (data || [])
      .filter((stock) => stock && stock.symbol && stock.name)
      .map((stock) => ({
        symbol: stock.symbol,
        companyName: stock.name,
        price: stock.price,
        changes: stock.change,
        changesPercentage: Number(stock.changesPercentage)
      }));
  } catch (error) {
    console.error('Error fetching selected stocks:', error);
    return [];
  }
};

export const getStockDetails = async (symbol) => {
  if (detailCache[symbol]) {
    return detailCache[symbol];
  }

  try {
    const data = await apiJson(`/api/v3/profile/${encodeURIComponent(symbol)}`);
    if (Array.isArray(data) && data.length > 0) {
      detailCache[symbol] = data[0];
      return data[0];
    }
    return null;
  } catch (error) {
    console.error(`Error fetching stock profile (${symbol}):`, error);
    return null;
  }
};

export const getStockHistory = async (symbol, timeRange = '1A') => {
  const cacheKey = `${symbol}-${timeRange}`;
  if (historyCache[cacheKey]) {
    return historyCache[cacheKey];
  }

  try {
    if (timeRange === '1G') {
      const data = await apiJson(`/api/v3/historical-chart/15min/${encodeURIComponent(symbol)}`);
      historyCache[cacheKey] = data;
      return data;
    }

    const timeseriesMap = {
      '1H': 5,
      '1A': 30,
      '1Y': 252,
      '5Y': 1260
    };

    const timeseries = timeseriesMap[timeRange] ?? 30;
    const payload = await apiJson(
      `/api/v3/historical-price-full/${encodeURIComponent(symbol)}?timeseries=${timeseries}`
    );
    const historical = payload?.historical ?? [];
    historyCache[cacheKey] = historical;
    return historical;
  } catch (error) {
    console.error(`Stock history fetch error for ${symbol} with range ${timeRange}:`, error);
    return [];
  }
};

export const getIncomeStatement = async (symbol) => {
  try {
    const data = await apiJson(`/api/v3/income-statement/${encodeURIComponent(symbol)}`);
    if (data && data.length > 0) {
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Gelir tablosu çekme hatası (${symbol}):`, error);
    return null;
  }
};

export const getPriceOnDate = async (symbol, date) => {
  try {
    const formatted =
      typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];

    const payload = await apiJson(
      `/api/v3/historical-price-full/${encodeURIComponent(symbol)}?from=${formatted}&to=${formatted}`
    );
    const historical = payload?.historical ?? [];

    if (historical.length > 0) {
      return parseFloat(historical[historical.length - 1].close);
    }

    const start = new Date(formatted);
    start.setDate(start.getDate() - 5);
    const fallbackFrom = start.toISOString().split('T')[0];

    const fallbackPayload = await apiJson(
      `/api/v3/historical-price-full/${encodeURIComponent(
        symbol
      )}?from=${fallbackFrom}&to=${formatted}`
    );
    const fallbackHistorical = fallbackPayload?.historical ?? [];

    if (fallbackHistorical.length > 0) {
      const last = fallbackHistorical[fallbackHistorical.length - 1];
      return parseFloat(last.close);
    }

    return null;
  } catch (error) {
    console.error(`Price on date fetch error for ${symbol}:`, error);
    return null;
  }
};

export const getCurrentPrice = async (symbol) => {
  try {
    if (symbol.toUpperCase() === 'USDTRY') {
      const data = await apiJson(`/api/v3/fx/${encodeURIComponent(symbol)}`);
      if (Array.isArray(data) && data.length > 0) {
        return parseFloat(data[0].ask ?? data[0].price ?? data[0].bid);
      }
      return null;
    }

    const data = await apiJson(`/api/v3/quote?symbols=${encodeURIComponent(symbol)}`);
    if (Array.isArray(data) && data.length > 0) {
      return parseFloat(data[0].price);
    }
    return null;
  } catch (error) {
    console.error(`Current price fetch error for ${symbol}:`, error);
    return null;
  }
};

export const getQuotes = async (symbols = []) => {
  if (!symbols || symbols.length === 0) return [];
  try {
    const data = await apiJson(buildQuotePath(symbols));
    if (!Array.isArray(data)) return [];
    return data.map((q) => ({
      symbol: q.symbol,
      name: q.name,
      price: q.price,
      change: q.change,
      changePercentage: Number(q.changesPercentage)
    }));
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
};
