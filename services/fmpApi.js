import { FMP_API_KEY } from '@env';

// Simple in-memory caches to avoid fetching the same data repeatedly
const detailCache = {};
const historyCache = {};

export const getSelectedStocks = async () => {
  const symbols = [
    'AAPL', 'AMZN', 'BRK-B', 'META', 'MSFT', 'NVDA', 'TSLA',
    'GM', 'FLNC', 'RC', 'APP', 'VTRS', 'GOOG', 'GOOGL', 'GTLL', 'USO',
    'BNO', 'OIH', 'DBO', 'OIL', 'PXJ', 'IEO', 'UCO', 'XOP', 'GUSH',
    'TBBK', 'SOUN', 'NPWR', 'BBAI','TKKYY', 'TKGBY'
  ];

  try {
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbols.join(',')}?apikey=${FMP_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    console.log('Quote data from API:', data);

    return data
      .filter(stock => stock && stock.symbol && stock.name)
      .map(stock => ({
        symbol: stock.symbol,
        companyName: stock.name,
        price: stock.price,
        changes: stock.change,
        changesPercentage: parseFloat(stock.changesPercentage),
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
  const res = await fetch(`https://financialmodelingprep.com/api/v3/profile/${symbol}?apikey=${FMP_API_KEY}`);
  const data = await res.json();
  if (data && data.length > 0) {
    const profile = data[0];
    if (profile && profile.mktCap && !profile.marketCap) {
      profile.marketCap = profile.mktCap;
    }
    detailCache[symbol] = profile;
    return profile;
  }
  return null;
};

export const getStockHistory = async (symbol, timeRange = '1A') => {
  const cacheKey = `${symbol}-${timeRange}`;
  if (historyCache[cacheKey]) {
    return historyCache[cacheKey];
  }
  let url = '';
  switch (timeRange) {
    case '1G':
      url = `https://financialmodelingprep.com/api/v3/historical-chart/15min/${symbol}?apikey=${FMP_API_KEY}`;
      break;
    case '1H':
      url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=5&apikey=${FMP_API_KEY}`;
      break;
    case '1A':
      url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=30&apikey=${FMP_API_KEY}`;
      break;
    case '1Y':
      url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=252&apikey=${FMP_API_KEY}`;
      break;
    case '5Y':
      url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=1260&apikey=${FMP_API_KEY}`;
      break;
    default:
      url = `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?timeseries=30&apikey=${FMP_API_KEY}`;
  }
  try {
    const res = await fetch(url);
    const data = await res.json();
    const result = data.historical || data || [];
    historyCache[cacheKey] = result;
    return result;
  } catch (error) {
    console.error(`Stock history fetch error for ${symbol} with range ${timeRange}:`, error);
    return [];
  }
};

export const getIncomeStatement = async (symbol) => {
  try {
    const url = `https://financialmodelingprep.com/api/v3/income-statement/${symbol}?period=annual&limit=1&apikey=${FMP_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Gelir Tablosu çekme hatası (${symbol}):`, error);
    throw error;
  }
};

export const getPriceOnDate = async (symbol, date) => {
  try {
    const formatted =
      typeof date === 'string' ? date.split('T')[0] : date.toISOString().split('T')[0];

    let res = await fetch(
      `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?from=${formatted}&to=${formatted}&apikey=${FMP_API_KEY}`
    );
    let data = await res.json();

    if (data && data.historical && data.historical.length > 0) {
      return parseFloat(data.historical[0].close);
    }

    // FMP does not provide data for weekends/holidays
    const start = new Date(formatted);
    start.setDate(start.getDate() - 5);
    const fallbackFrom = start.toISOString().split('T')[0];

    res = await fetch(
      `https://financialmodelingprep.com/api/v3/historical-price-full/${symbol}?from=${fallbackFrom}&to=${formatted}&apikey=${FMP_API_KEY}`
    );
    data = await res.json();

    if (data && data.historical && data.historical.length > 0) {
      const last = data.historical[data.historical.length - 1];
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
    let url;
    const isForex = symbol.toUpperCase() === 'USDTRY';

    if (isForex) {
      url = `https://financialmodelingprep.com/api/v3/fx/${symbol}?apikey=${FMP_API_KEY}`;
    } else {
      url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${FMP_API_KEY}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      if (isForex) {
        return parseFloat(data[0].ask);
      } else {
        return parseFloat(data[0].price);
      }
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
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbols.join(',')}?apikey=${FMP_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map(q => ({
      symbol: q.symbol,
      name: q.name,
      price: q.price,
      change: q.change,
      changePercentage: parseFloat(q.changesPercentage),
    }));
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return [];
  }
};
