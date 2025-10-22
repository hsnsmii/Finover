import os
import requests
import pandas as pd
import pandas_ta as ta
from dotenv import load_dotenv
load_dotenv()

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import (
    TimeSeriesSplit,
    GridSearchCV,
    train_test_split,
    cross_val_score,
)

try:
    from xgboost import XGBRegressor
except Exception:
    XGBRegressor = None  # type: ignore
import joblib

API_KEY = os.getenv("FMP_API_KEY")


def time_series_cv_score(model, X, y, n_splits: int = 5):
    """Evaluate a model using time series cross validation."""
    tscv = TimeSeriesSplit(n_splits=n_splits)
    scores = cross_val_score(model, X, y, cv=tscv, scoring="neg_mean_absolute_error")
    return scores


def optimize_hyperparameters(model, param_grid, X, y):
    """Run grid search to find best hyperparameters."""
    tscv = TimeSeriesSplit(n_splits=3)
    search = GridSearchCV(model, param_grid, cv=tscv, scoring="neg_mean_absolute_error")
    search.fit(X, y)
    return search.best_estimator_

# S&P 500 verisi çek
def get_market_data():
    url = f"https://financialmodelingprep.com/api/v3/historical-price-full/SPY?apikey={API_KEY}&serietype=line"
    response = requests.get(url)
    if response.status_code != 200:
        print("[HATA] SPY verisi çekilemedi.")
        return None
    data = response.json()
    prices = data.get('historical')
    df = pd.DataFrame(prices)
    df = df[['date', 'close']].rename(columns={'close': 'spy_close'})
    return df

# Hisse verisi çek
def get_historical_data(symbol):
    url = f"https://financialmodelingprep.com/api/v3/historical-price-full/{symbol}?apikey={API_KEY}&serietype=line"
    response = requests.get(url)
    if response.status_code != 200:
        print(f"[HATA] Veri çekilemedi: {symbol}")
        return None
    data = response.json()
    prices = data.get('historical')
    if not prices:
        print(f"[Uyarı] Veri bulunamadı: {symbol}")
        return None
    df = pd.DataFrame(prices)
    df = df[['date', 'close']].sort_values('date')
    df.to_csv(f"data/csv/{symbol}_history.csv", index=False)
    print(f"[✓] {symbol} verisi kaydedildi → data/csv/{symbol}_history.csv")
    return df

# Beta hesapla
def calculate_beta(stock_df, market_df):
    merged = pd.merge(stock_df, market_df, on='date', how='inner')
    merged['stock_return'] = merged['close'].pct_change()
    merged['market_return'] = merged['spy_close'].pct_change()
    merged.dropna(inplace=True)

    if len(merged) < 20:
        print(f"[Uyarı] Yetersiz veri ile beta hesaplanamaz. {len(merged)} gün")
        return None

    covariance = np.cov(merged['stock_return'], merged['market_return'])[0][1]
    variance = np.var(merged['market_return'], ddof=1)

    if variance == 0 or np.isnan(variance):
        print(f"[Uyarı] Market varyansı sıfır veya geçersiz.")
        return None

    beta = covariance / variance
    return beta

# Teknik göstergeler ekle
def add_indicators(df, beta_value):
    # some datasets only include close price; reuse close for high/low if absent
    if 'high' not in df.columns:
        df['high'] = df['close']
    if 'low' not in df.columns:
        df['low'] = df['close']

    df['rsi'] = ta.rsi(df['close'])
    df['sma_20'] = ta.sma(df['close'], length=20)
    df['ema_20'] = ta.ema(df['close'], length=20)
    macd = ta.macd(df['close'])
    df['macd'] = macd['MACD_12_26_9'] if 'MACD_12_26_9' in macd else None
    df['atr'] = ta.atr(df['high'], df['low'], df['close'])
    stoch = ta.stoch(df['high'], df['low'], df['close'])
    df['stoch_k'] = stoch['STOCHk_14_3_3'] if 'STOCHk_14_3_3' in stoch else None
    df['volatility'] = df['close'].rolling(20).std()
    df['beta'] = beta_value
    # Placeholder fundamental ratios
    df['pe_ratio'] = 10.0
    df['pb_ratio'] = 2.0
    df['de_ratio'] = 1.0
    return df

# Model eğitimi (yüzdesel skor tahmini için regresyon modeli)
def train_model(df, symbol):
    df = df.dropna(subset=['rsi', 'sma_20', 'volatility', 'beta'])

    # Risk skoru hesapla (örnek formül, geliştirilebilir)
    df['risk_score'] = (
        0.4 * (df['volatility'] / df['volatility'].max()) +
        0.3 * (df['beta'] / df['beta'].max()) +
        0.2 * (1 - df['rsi'] / 100) +
        0.1 * np.random.rand(len(df))
    ).clip(0, 1)

    feature_cols = [
        'rsi', 'sma_20', 'ema_20', 'macd', 'atr', 'stoch_k',
        'volatility', 'beta', 'pe_ratio', 'pb_ratio', 'de_ratio'
    ]
    features = df[feature_cols]
    targets = df['risk_score']

    X_train, X_test, y_train, y_test = train_test_split(features, targets, test_size=0.2)
    if XGBRegressor is not None:
        base_model = XGBRegressor(objective='reg:squarederror')
    else:
        base_model = RandomForestRegressor()

    param_grid = {"n_estimators": [50, 100], "max_depth": [3, None]}
    model = optimize_hyperparameters(base_model, param_grid, X_train, y_train)

    scores = time_series_cv_score(model, features, targets, n_splits=3)
    print(f"[TS CV] MAE: {-scores.mean():.4f}")

    version = pd.Timestamp.utcnow().strftime('%Y%m%d%H%M%S')
    model_path = f"data/models/{symbol}_risk_model_{version}.pkl"
    joblib.dump(model, model_path)
    print(f"[✓] Model kaydedildi: {model_path}")

# Her sembol için süreci işlet
def run_pipeline(symbol, market_df):
    df = get_historical_data(symbol)
    if df is not None:
        beta = calculate_beta(df, market_df)
        if beta is None:
            print(f"[Uyarı] Beta hesaplanamadı: {symbol}")
            return
        df = add_indicators(df, beta)
        train_model(df, symbol)

# Ana süreç
if __name__ == "__main__":
    os.makedirs("data/csv", exist_ok=True)
    os.makedirs("data/models", exist_ok=True)

    symbols = [
        'AAPL', 'AMZN', 'META', 'MSFT', 'NVDA', 'TSLA',
        'FLNC', 'RC', 'APP', 'GOOGL', 'TBBK', 'SOUN'
    ]

    market_df = get_market_data()
    if market_df is None:
        print("[HATA] SPY verisi olmadan işlem yapılamaz.")
    else:
        for symbol in symbols:
            print(f"\n🚀 İşleniyor: {symbol}")
            run_pipeline(symbol, market_df)

    # Basit zamanlanmış eğitim (örnek)
    try:
        import schedule
        def job():
            for symbol in symbols:
                run_pipeline(symbol, market_df)
        schedule.every().week.do(job)
        print("[i] Scheduled weekly retraining aktif")
        while True:
            schedule.run_pending()
    except Exception:
        pass
