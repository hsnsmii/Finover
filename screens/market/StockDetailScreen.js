import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  SafeAreaView,
  Pressable,
  useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LineChart } from 'react-native-chart-kit';
import { Feather } from '@expo/vector-icons';

import { getStockDetails, getStockHistory, getIncomeStatement } from '../../services/fmpApi';
import { API_BASE_URL, ML_BASE_URL } from '../../services/config';
import { getStyles, lightTheme, darkTheme } from "../../styles/StockDetailStyle";

const screenWidth = Dimensions.get('window').width;

const calculateBeta = (stockHistory, marketHistory) => {
  if (!stockHistory || !marketHistory || stockHistory.length < 21 || marketHistory.length < 21) return null;
  const stockCloses = stockHistory.map(h => h.close).reverse();
  const marketCloses = marketHistory.map(h => h.close).reverse();

  const stockReturns = [], marketReturns = [];
  for (let i = 1; i < 21; i++) {
    stockReturns.push((stockCloses[i] - stockCloses[i - 1]) / stockCloses[i - 1]);
    marketReturns.push((marketCloses[i] - marketCloses[i - 1]) / marketCloses[i - 1]);
  }

  const meanStock = stockReturns.reduce((a, b) => a + b, 0) / stockReturns.length;
  const meanMarket = marketReturns.reduce((a, b) => a + b, 0) / marketReturns.length;

  let covariance = 0, marketVariance = 0;
  for (let i = 0; i < stockReturns.length; i++) {
    covariance += (stockReturns[i] - meanStock) * (marketReturns[i] - meanMarket);
    marketVariance += Math.pow(marketReturns[i] - meanMarket, 2);
  }

  return marketVariance === 0 ? null : covariance / marketVariance; 
};
const calculateIndicators = (history) => {
  if (!history || history.length < 20) return null;
  const closes = history.map(h => h.close).reverse();

  let gains = 0, losses = 0;
  for (let i = 1; i < 15; i++) {
    const change = closes[i] - closes[i - 1];
    change > 0 ? gains += change : losses -= change;
  }
  const avgGain = gains / 14, avgLoss = losses / 14;
  const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  const sma_20 = closes.slice(0, 20).reduce((sum, val) => sum + val, 0) / 20;
  const mean = sma_20;
  const variance = closes.slice(0, 20).reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / 20;
  const volatility = Math.sqrt(variance);

  return { rsi, sma_20, volatility };
};

const calculateFallbackRisk = (indicators, beta) => {
  if (!indicators) return null;
  const normRsi = Math.min(100, Math.max(0, indicators.rsi)) / 100;
  const vol = Math.min(1, Math.abs(indicators.volatility));
  const b = beta == null ? 1 : Math.min(2, Math.abs(beta)) / 2;
  const risk = (normRsi * 0.4 + vol * 0.4 + b * 0.2) * 100;
  return Math.round(risk);
};

const StockDetailScreen = ({ route, navigation }) => {
  const { symbol } = route.params;

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  const styles = getStyles(theme);

  const [stock, setStock] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [watchlists, setWatchlists] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [riskPercentage, setRiskPercentage] = useState(null);
  const [timeRange, setTimeRange] = useState('1A');
  const [tooltipData, setTooltipData] = useState(null);

  useEffect(() => {
    setTooltipData(null);

    const fetchStockData = async () => {
      setLoading(true);
      setRiskPercentage(null);
      try {

        const [detail, historical, marketHistorical, incomeStatementData, userId] = await Promise.all([
          getStockDetails(symbol),
          getStockHistory(symbol, timeRange),
          getStockHistory('SPY', timeRange),
          getIncomeStatement(symbol), 
          AsyncStorage.getItem('userId'),
        ]);

        const calculatedBeta = calculateBeta(historical, marketHistorical);

        let calculatedPe = null;
        if (incomeStatementData && incomeStatementData.length > 0 && detail.price) {
          const latestEPS = incomeStatementData[0].eps;

          if (latestEPS && latestEPS > 0) {
            calculatedPe = detail.price / latestEPS;
          }
        }

        setStock({
          ...detail,
          beta: calculatedBeta, 
          pe: calculatedPe,     
        });

        setHistory(historical);

        const indicators = calculateIndicators(historical);

        if (indicators && calculatedBeta !== null) {
          const payload = { ...indicators, beta: calculatedBeta, symbol };
          try {
            const response = await fetch(`${ML_BASE_URL}/predict-risk`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (response.ok && data.risk_percentage != null) {
              setRiskPercentage(data.risk_percentage);
            } else {
              setRiskPercentage(calculateFallbackRisk(indicators, calculatedBeta));
            }
          } catch (e) {
            setRiskPercentage(calculateFallbackRisk(indicators, calculatedBeta));
          }
        }

        if (userId) {
          const response = await fetch(`${API_BASE_URL}/api/watchlists/${userId}`);
          const userWatchlists = await response.json();
          setWatchlists(userWatchlists);
          const isStockInAnyWatchlist = userWatchlists.some(list =>
            list.stocks && list.stocks.some(s => s.symbol === symbol)
          );
          setIsBookmarked(isStockInAnyWatchlist);
        }

      } catch (err) {
        console.error("Detay sayfası veri çekme hatası:", err);
        Alert.alert("Hata", "Hisse senedi verileri yüklenirken bir sorun oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol, timeRange]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: stock ? stock.companyName : symbol,
      headerTitleStyle: { color: theme.colors.text },
      headerBackTitleVisible: false,
      headerShadowVisible: false,
      headerStyle: { backgroundColor: theme.colors.background },
      headerTintColor: theme.colors.primary,
      headerRight: () => (
        <TouchableOpacity onPress={handleAddWithFallback} style={{ marginRight: 15 }}>
          <Feather
            name="star"
            size={24}
            color={isBookmarked ? theme.colors.accent : theme.colors.textSecondary}
            fill={isBookmarked ? theme.colors.accent : 'transparent'}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, isBookmarked, theme, stock, handleAddWithFallback]);

  const handleAddToWatchlist = async (listId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/watchlists/${listId}/stocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      if (response.ok) {
        Alert.alert('Başarılı', `Hisse "${watchlists.find(l => l.id === listId).name}" listesine eklendi.`);
        setIsBookmarked(true);
        setModalVisible(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ekleme başarısız');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Hata', `Ekleme sırasında sorun oluştu: ${err.message}`);
    }
  };
  const handleAddWithFallback = async () => {
    if (isBookmarked) {
        Alert.alert('Bilgi', `${symbol} zaten bir takip listenizde bulunuyor.`);
        return;
    }
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
        Alert.alert("Giriş Gerekli", "Hisse eklemek için lütfen giriş yapın.");
        return;
    }
    if (watchlists.length === 0) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/watchlists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Favorilerim', user_id: userId }),
        });
        const newList = await response.json();
        setWatchlists([newList]);
        await handleAddToWatchlist(newList.id);
      } catch (error) {
         Alert.alert('Hata', 'Varsayılan liste oluşturulurken bir hata oluştu.');
      }
    } else {
      setModalVisible(true);
    }
  };

  const getChartData = () => {
    if (!history || history.length === 0) return { labels: [], datasets: [{ data: [0] }] };
    const chartLabels = history.map(() => '');
    const chartPrices = history.map(h => h.close).reverse();
    return {
      labels: chartLabels,
      datasets: [{
        data: chartPrices,
        strokeWidth: 2.5,
        color: () => (stock?.changes >= 0 ? theme.colors.positive : theme.colors.negative)
      }],
    };
  };

  const renderTooltip = () => {
    if (!tooltipData) return null;
    const tooltipWidth = 120;
    let xPosition = tooltipData.x - (tooltipWidth / 2);
    if (xPosition < 16) xPosition = 16;
    if (xPosition + tooltipWidth > screenWidth - 16) xPosition = screenWidth - tooltipWidth - 16;
    return (
      <View style={[styles.tooltipContainer, { left: xPosition, top: tooltipData.y - 70 }]}>
        <Text style={styles.tooltipPrice}>${tooltipData.value.toFixed(2)}</Text>
        <Text style={styles.tooltipDate}>{tooltipData.date}</Text>
      </View>
    );
  };

  const renderPriceChange = () => {
    if (!stock || typeof stock.changes === 'undefined') return null;
    const changeValue = stock.changes || 0;
    const isPositive = changeValue >= 0;
    const percentageValue = stock.changesPercentage || 0;
    const color = isPositive ? theme.colors.positive : theme.colors.negative;
    return (
      <View style={styles.priceChangeContainer}>
        <Feather name={isPositive ? 'arrow-up-right' : 'arrow-down-right'} size={18} color={color} />
        <Text style={[styles.priceChangeText, { color }]}>{changeValue.toFixed(2)} ({percentageValue.toFixed(2)}%)</Text>
      </View>
    );
  };

  const renderKeyStats = () => {
    const stats = [
      {
        label: 'Piyasa Değeri',
        value: stock.marketCap ? `$${(stock.marketCap / 1e9).toFixed(2)}B` : 'N/A',
      },
      { label: 'F/K Oranı', value: stock.pe ? stock.pe.toFixed(2) : 'N/A' },
      { label: 'Beta', value: stock.beta ? stock.beta.toFixed(2) : 'N/A' },
      { label: 'Sektör', value: stock.sector || 'N/A' },
    ];
    return (
      <View style={styles.statsListContainer}>
        {stats.map((stat, index) => (
          <View key={stat.label} style={[styles.statRow, index === stats.length - 1 && styles.statRowLast]}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>
    );
  };

  if (loading || !stock) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setTooltipData(null)}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.symbol}>{symbol}</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>${Number(stock.price).toFixed(2)}</Text>
          {renderPriceChange()}
        </View>

        <View>
            <LineChart
                data={getChartData()}
                width={screenWidth}
                height={250}
                withDots={false}
                withInnerLines={false}
                withOuterLines={false}
                withHorizontalLabels={false}
                withVerticalLabels={false}
                chartConfig={{
                    ...theme.chartConfig,
                    fillShadowGradient: stock?.changes >= 0 ? theme.colors.positive : theme.colors.negative,
                    fillShadowGradientOpacity: 0.1,
                }}
                bezier
                style={styles.chart}
                onDataPointClick={(data) => {
                    if (tooltipData && tooltipData.index === data.index) {
                      setTooltipData(null);
                    } else {
                      const originalPoint = history.slice().reverse()[data.index];
                      if (originalPoint) {
                        setTooltipData({
                            x: data.x,
                            y: data.y,
                            value: data.value,
                            date: new Date(originalPoint.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }),
                            index: data.index,
                        });
                      }
                    }
                }}
                decorator={() => {
                    if (!tooltipData) return null;
                    return (
                      <View>
                        <View style={[styles.decoratorLine, { left: tooltipData.x, height: 250 }]} />
                        <View style={[styles.decoratorDot, { left: tooltipData.x - 7, top: tooltipData.y - 7 }]} />
                        {renderTooltip()}
                      </View>
                    );
                }}
                withShadow
            />
            <View style={styles.timeRangeSelector}>
                {['1G', '1H', '1A', '1Y', '5Y'].map(range => (
                    <TouchableOpacity key={range} style={[styles.rangeButton, timeRange === range && styles.activeRange]} onPress={() => setTimeRange(range)}>
                        <Text style={[styles.rangeText, timeRange === range && styles.activeRangeText]}>{range}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Anahtar İstatistikler</Text>
            {renderKeyStats()}
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Yapay Zeka Risk Değerlendirmesi</Text>
            {riskPercentage !== null ? (
              <View style={styles.riskContent}>
                  <Text style={styles.riskScore}>%{riskPercentage.toFixed(0)}</Text>
                  <View style={{ flex: 1, marginLeft: 20 }}>
                      <Text style={styles.riskLabel}>
                          {riskPercentage < 40 ? 'Düşük Risk' : riskPercentage < 70 ? 'Orta Risk' : 'Yüksek Risk'}
                      </Text>
                      <View style={styles.riskBarContainer}>
                          <View style={[styles.riskBar, { width: `${riskPercentage}%`, backgroundColor: riskPercentage < 40 ? theme.colors.positive : riskPercentage < 70 ? theme.colors.warning : theme.colors.negative }]} />
                      </View>
                  </View>
              </View>
            ) : (
              <Text style={styles.descriptionText}>Risk skoru hesaplanıyor veya veri yetersiz...</Text>
            )}
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Şirket Hakkında</Text>
            <Text style={styles.descriptionText}>{stock.description || 'Açıklama bulunamadı.'}</Text>
        </View>

        <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
            <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)} />
            <View style={styles.modalContent}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitle}>Listeye Ekle</Text>
                {watchlists.map(list => (
                    <TouchableOpacity key={list.id} style={styles.modalItem} onPress={() => handleAddToWatchlist(list.id)}>
                        <Feather name="list" size={22} color={theme.colors.primary} />
                        <Text style={styles.modalItemText}>{list.name}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StockDetailScreen;
