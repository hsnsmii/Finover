import axios from 'axios';
import { TWELVE_DATA_API_KEY } from '@env';

const BASE_URL = 'https://api.twelvedata.com';

export const getHistoricalData = async (symbol) => {
  try {
    const response = await axios.get(`${BASE_URL}/time_series`, {
      params: {
        symbol,
        interval: '1day',
        outputsize: 30,
        apikey: TWELVE_DATA_API_KEY,
      },
    });

    if (response.data && response.data.values) {
      // Dizi olarak en günceli başta geliyor → tersten sıralayalım
      return response.data.values.reverse(); // [{datetime, close, ...}, ...]
    } else {
      throw new Error(response.data.message || 'Veri alınamadı');
    }
  } catch (error) {
    console.error('TwelveData API Hatası:', error.message);
    return [];
  }
};
