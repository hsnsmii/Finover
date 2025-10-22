const express = require('express');
const router = express.Router();

// A static list of available stocks with basic symbol and name
const stocks = [
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'BRK-B', name: 'Berkshire Hathaway B' },
  { symbol: 'BRK-A', name: 'Berkshire Hathaway A' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'GM', name: 'General Motors Co.' },
  { symbol: 'FLNC', name: 'Fluence Energy Inc.' },
  { symbol: 'RC', name: 'Ready Capital Corp.' },
  { symbol: 'APP', name: 'Applovin Corp.' },
  { symbol: 'VTRS', name: 'Viatris Inc.' },
  { symbol: 'GOOG', name: 'Alphabet Inc. Class C' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A' },
  { symbol: 'GTLL', name: 'Green Thumb Industries' },
  { symbol: 'USO', name: 'United States Oil Fund' },
  { symbol: 'BNO', name: 'United States Brent Oil Fund' },
  { symbol: 'OIH', name: 'VanEck Oil Services ETF' },
  { symbol: 'DBO', name: 'Invesco DB Oil Fund' },
  { symbol: 'OIL', name: 'iPath Pure Beta Crude Oil ETN' },
  { symbol: 'PXJ', name: 'Invesco Dynamic Oil & Gas Svcs ETF' },
  { symbol: 'IEO', name: 'iShares U.S. Oil & Gas Exploration & Prod ETF' },
  { symbol: 'UCO', name: 'ProShares Ultra Bloomberg Crude Oil' },
  { symbol: 'XOP', name: 'SPDR S&P Oil & Gas Exploration & Prod ETF' },
  { symbol: 'GUSH', name: 'Direxion Daily S&P Oil & Gas Bull 2X' },
  { symbol: 'TBBK', name: 'The Bancorp Inc.' },
  { symbol: 'SOUN', name: 'SoundHound AI Inc.' },
  { symbol: 'NPWR', name: 'NET Power Inc.' },
  { symbol: 'BBAI', name: 'BigBear.ai Holdings Inc.' },
  { symbol: 'TKKYY', name: 'Tokuyama Corp.' },
  { symbol: 'TKGBY', name: 'Turkiye Garanti Bankasi AS' }
];

router.get('/', (req, res) => {
  res.json(stocks);
});

module.exports = router;
