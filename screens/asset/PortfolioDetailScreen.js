import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import axios from 'axios';

import { getStockDetails, getPriceOnDate, getCurrentPrice } from '../../services/fmpApi';
import { API_BASE_URL } from '../../services/config';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const API_URL = API_BASE_URL;

const AppColors = {
  background: '#F4F6F8', cardBackground: '#FFFFFF', primaryText: '#2C3E50',
  secondaryText: '#7F8C8D', tertiaryText: '#B0BEC5', primaryAction: '#FFA500',
  primaryActionText: '#FFFFFF', separator: '#E0E6ED', profit: '#2ECC71',
  loss: '#E74C3C', edit: '#3498DB', delete: '#E74C3C', neutral: '#B0BEC5',
};
const PIE_CHART_COLORS = [
  '#5DADE2', '#F39C12', '#E74C3C', '#1ABC9C', '#8E44AD', '#2ECC71', '#3498DB',
  '#F1C40F', '#D35400', '#7F8C8D', '#C0392B', '#2980B9', '#27AE60', '#D68910', '#A569BD'
];
const getRandomColorForPie = (index) => PIE_CHART_COLORS[index % PIE_CHART_COLORS.length];

const PortfolioDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { listId, listName } = route.params;

  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [pieChartData, setPieChartData] = useState([]);
  const [expandedPositionId, setExpandedPositionId] = useState(null);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: '', headerBackTitleVisible: false, headerTintColor: AppColors.primaryText,
      headerBackImage: () => <Ionicons name="arrow-back" size={24} color={AppColors.primaryText} style={{ marginLeft: 15 }} />,
      headerStyle: { backgroundColor: AppColors.background, elevation: 0, shadowOpacity: 0 },
    });
  }, [navigation]);

  const fetchPositions = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true); else setRefreshing(true);
    try {

      const res = await axios.get(`${API_URL}/api/watchlists/${listId}/stocks`);

      if (!res.data || !Array.isArray(res.data) || res.data.length === 0) {
        setPositions([]); setTotalValue(0); setTotalProfit(0); setPieChartData([]);
        if (!isRefresh) setLoading(false); else setRefreshing(false);
        return;
      }

      const currentUsdRate = await getCurrentPrice('USDTRY');
      const currentGoldUsd = await getCurrentPrice('XAUUSD');

      const enrichedPositionsPromises = res.data.map(async (item) => {
        try {
          const stockData = await getStockDetails(item.symbol);
          if (!stockData || typeof stockData.price !== 'number') {
            const cost = Number(item.quantity) * Number(item.price);
            return {
              ...item,
              id: item._id || item.id,
              dbPrice: Number(item.price),
              companyName: stockData?.companyName || item.symbol,
              marketPrice: null,
              profitLoss: null, profitLossPercent: null, cost, marketValue: null,
            };
          }
          const marketPrice = parseFloat(stockData.price);
          const cost = Number(item.quantity) * Number(item.price);
          const marketValue = Number(item.quantity) * marketPrice;
          const profitLoss = marketValue - cost;
          const profitLossPercent = cost !== 0 ? (profitLoss / cost) * 100 : 0;

          const usdOnDate = await getPriceOnDate('USDTRY', item.date);
          const goldUsdOnDate = await getPriceOnDate('XAUUSD', item.date);
          let altUsdValue = null, altGoldValue = null;
          if (usdOnDate && currentUsdRate) {
            altUsdValue = (cost / usdOnDate) * currentUsdRate;
          }
          if (usdOnDate && goldUsdOnDate && currentUsdRate && currentGoldUsd) {
            altGoldValue = (cost / (goldUsdOnDate * usdOnDate)) * currentGoldUsd * currentUsdRate;
          }

          return {
            ...item,
            id: item._id || item.id,
            dbPrice: Number(item.price),
            companyName: stockData.companyName || item.symbol,
            marketPrice,
            profitLoss,
            profitLossPercent,
            cost,
            marketValue,
            usdAlternative: altUsdValue,
            goldAlternative: altGoldValue,
          };
        } catch (apiError) {
          const cost = Number(item.quantity) * Number(item.price);
          return {
            ...item,
            id: item._id || item.id,
            dbPrice: Number(item.price),
            companyName: item.symbol,
            marketPrice: null,
            profitLoss: null,
            profitLossPercent: null,
            cost, marketValue: null, usdAlternative: null, goldAlternative: null,
          };
        }
      });
      const enrichedPositionsResult = (await Promise.all(enrichedPositionsPromises)).filter(Boolean);
      const totalMarketValue = enrichedPositionsResult.reduce((acc, pos) => acc + (pos.marketValue || 0), 0);
      const totalCalculatedProfit = enrichedPositionsResult.reduce((acc, pos) => acc + (pos.profitLoss || 0), 0);
      setTotalValue(totalMarketValue); setTotalProfit(totalCalculatedProfit); setPositions(enrichedPositionsResult);

      if (enrichedPositionsResult.length > 0 && totalMarketValue > 0) {
        const chartData = enrichedPositionsResult
          .filter(pos => pos.marketValue && pos.marketValue > 0)
          .map((pos, index) => ({
            value: pos.marketValue, color: getRandomColorForPie(index),
            legendLabel: pos.symbol, text: `${((pos.marketValue / totalMarketValue) * 100).toFixed(0)}%`,
          }))
          .sort((a, b) => b.value - a.value);
        setPieChartData(chartData);
      }
    } catch (err) {
      Alert.alert('Hata', `Pozisyonlar alınırken bir sorun oluştu: ${err.response?.data?.message || 'Lütfen internet bağlantınızı kontrol edin.'}`);
      setPositions([]); setPieChartData([]);
    } finally {
      if (!isRefresh) setLoading(false); else setRefreshing(false);
    }
  }, [listId]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener('focus', () => { fetchPositions(); });
    return unsubscribeFocus;
  }, [navigation, fetchPositions]);

  const toggleExpand = (positionId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedPositionId(currentId => (currentId === positionId ? null : positionId));
  };

  const handleDelete = async (symbol) => {
    Alert.alert(
      'Pozisyonu Sil', `${symbol} sembollü pozisyonu portföyden kalıcı olarak silmek istediğinize emin misiniz?`,
      [{ text: 'İptal', style: 'cancel' },
       { text: 'Evet, Sil', style: 'destructive',
         onPress: async () => {
           try {

             await axios.delete(`${API_URL}/api/watchlists/${listId}/stocks/${symbol}`);
             Alert.alert('Başarılı', `${symbol} portföyden silindi.`);
             fetchPositions(true); 
           } catch (err) {
             Alert.alert('Hata', `${symbol} silinirken bir sorun oluştu: ${err.response?.data?.message || 'Sunucu hatası'}`);
           }
         },
       },]
    );
  };

  const handleEdit = (position) => {
    navigation.navigate('AddPosition', {
      listId, symbol: position.symbol, isEdit: true,
      currentQuantity: position.quantity, currentPrice: position.dbPrice,
    });
  };

  const renderItem = ({ item }) => {
    const isExpanded = expandedPositionId === item.id;
    const profitColor = item.profitLoss === null ? AppColors.neutral : (item.profitLoss >= 0 ? AppColors.profit : AppColors.loss);

    const dailyChange = (item.marketPrice || 0) * (Math.random() * 0.04 - 0.02) * item.quantity;
    const dailyChangeDenominator = item.marketValue - dailyChange;
    const dailyChangePercent = dailyChangeDenominator !== 0 ? (dailyChange / dailyChangeDenominator) * 100 : 0;
    const dailyChangeColor = dailyChange >= 0 ? AppColors.profit : AppColors.loss;

    const usdAlternativeProfit = item.usdAlternative !== null ? item.usdAlternative - item.cost : null;
    const vsUsdPerformance = item.profitLoss !== null && usdAlternativeProfit !== null ? item.profitLoss - usdAlternativeProfit : null;

    const goldAlternativeProfit = item.goldAlternative !== null ? item.goldAlternative - item.cost : null;
    const vsGoldPerformance = item.profitLoss !== null && goldAlternativeProfit !== null ? item.profitLoss - goldAlternativeProfit : null;

    const renderComparisonRow = (label, performanceValue, iconName) => {
      let valueContent;
      if (performanceValue === null) {
        valueContent = <Text style={styles.comparisonValueNeutral}>Hesaplanamadı</Text>;
      } else {
        const isPositive = performanceValue >= 0;
        const color = isPositive ? AppColors.profit : AppColors.loss;
        valueContent = (
          <Text style={[styles.comparisonValue, { color }]}>
            {isPositive ? '+' : ''}₺{performanceValue.toFixed(2)}
          </Text>
        );
      }
      return (
        <View style={styles.comparisonRow}>
          <View style={styles.comparisonLabelContainer}>
            <Ionicons name={iconName} size={16} color={AppColors.secondaryText} style={styles.comparisonIcon} />
            <Text style={styles.comparisonLabel}>{label}'a göre fark</Text>
          </View>
          {valueContent}
        </View>
      );
    };

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => toggleExpand(item.id)}
        style={[styles.positionCard, { borderColor: isExpanded ? AppColors.primaryAction : 'transparent' }]}
      >
        <View style={styles.collapsedContainer}>
          <View style={styles.collapsedLeft}>
            <Text style={styles.symbol}>{item.symbol}</Text>
            <Text style={styles.metricLabel}>Piyasa Değeri</Text>
            <Text style={styles.marketValueText}>{item.marketValue !== null ? `₺${item.marketValue.toFixed(2)}` : 'N/A'}</Text>
          </View>
          <View style={styles.collapsedRight}>
            <Text style={styles.metricLabel}>(Toplam K/Z)</Text>
            <Text style={[styles.totalProfitLossText, { color: profitColor }]}>
              {item.profitLoss !== null ? `${item.profitLoss >= 0 ? '+' : ''}₺${item.profitLoss.toFixed(2)}` : 'N/A'}
            </Text>
            {item.profitLossPercent !== null && <Text style={[styles.totalProfitLossPercent, { color: profitColor }]}>({item.profitLossPercent.toFixed(2)}%)</Text>}
          </View>
        </View>

        {isExpanded && (
          <View style={styles.expandedContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Toplam Maliyet</Text>
              <Text style={styles.detailValue}>₺{item.cost.toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Adet & Ort. Maliyet</Text>
              <Text style={styles.detailValue}>{item.quantity} adet / ₺{item.dbPrice.toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Güncel Fiyat</Text>
                <Text style={styles.detailValue}>{item.marketPrice !== null ? `₺${item.marketPrice.toFixed(2)}` : 'N/A'}</Text>
            </View>

            <View style={styles.comparisonContainer}>
              <Text style={styles.comparisonTitle}>Alternatif Getiri Karşılaştırması</Text>
              {renderComparisonRow('Dolar', vsUsdPerformance, 'logo-usd')}
              {renderComparisonRow('Altın', vsGoldPerformance, 'analytics-outline')}
            </View>

            <View style={styles.actionContainer}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
                <Ionicons name="create-outline" size={20} color={AppColors.edit} />
                <Text style={[styles.actionButtonText, { color: AppColors.edit }]}>Düzenle</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.symbol)} style={styles.actionButton}>
                <Ionicons name="trash-outline" size={20} color={AppColors.delete} />
                <Text style={[styles.actionButtonText, { color: AppColors.delete }]}>Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        <View style={styles.expandIconContainer}>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={AppColors.secondaryText} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDistributionTable = (data, total) => (
    <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Varlık Türü</Text>
            <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Oran</Text>
        </View>
        {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
                <View key={`row-${index}`} style={styles.tableRow}>
                    <View style={styles.tableCellLabelContainer}>
                        <View style={[styles.legendColorBox, { backgroundColor: item.color }]} />
                        <Text style={styles.tableCellText}>{item.legendLabel}</Text>
                    </View>
                    <Text style={styles.tableCellPercentage}>{`%${percentage.toFixed(2)}`}</Text>
                </View>
            );
        })}
    </View>
  );

  const renderListHeader = () => (
    <>
      <View style={[styles.summaryCard, { borderColor: totalProfit >= 0 ? AppColors.profit : AppColors.loss }]}>
        <Text style={styles.summaryCardTitle}>Portföy Özeti</Text>
        <View style={styles.summaryRow}>
          <Ionicons name="wallet-outline" size={22} color={AppColors.primaryText} style={styles.summaryIcon} />
          <Text style={styles.summaryLabel}>Toplam Değer:</Text>
          <Text style={styles.summaryValue}>₺{totalValue.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryRow, styles.summaryRowLast]}>
          <Ionicons name={totalProfit >= 0 ? "trending-up-outline" : "trending-down-outline"} size={22} color={totalProfit >= 0 ? AppColors.profit : AppColors.loss} style={styles.summaryIcon} />
          <Text style={styles.summaryLabel}>Toplam Kâr/Zarar:</Text>
          <Text style={[styles.summaryValue, { color: totalProfit >= 0 ? AppColors.profit : AppColors.loss }]}>₺{totalProfit.toFixed(2)}</Text>
        </View>
      </View>
      {pieChartData.length > 0 && (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Varlık Dağılımı</Text>
          <View style={styles.distributionContainer}>
            <View style={styles.distributionTableContainer}>{renderDistributionTable(pieChartData, totalValue)}</View>
            <View style={styles.pieChartContainer}>
              <PieChart data={pieChartData} donut showText={false} radius={85} innerRadius={45} focusOnPress
                centerLabelComponent={() => (
                  <View style={styles.chartCenterLabelContainer}>
                    <Text style={styles.chartCenterLabelValue}>{`₺${(totalValue / 1000).toFixed(1)}k`}</Text>
                  </View>
                )}
              />
            </View>
          </View>
        </View>
      )}
      {positions.length > 0 && <Text style={styles.positionsHeaderTitle}>Pozisyonlar</Text>}
    </>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.fullScreenLoader}>
          <ActivityIndicator size="large" color={AppColors.primaryAction} />
          <Text style={styles.loadingText}>Portföy yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.stickyHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 15, left: 15, bottom: 15, right: 15 }}>
          <Ionicons name="arrow-back" size={26} color={AppColors.primaryText} />
        </TouchableOpacity>
        <View style={styles.stickyHeaderTitleBlock}>
          <Text style={styles.pageHeaderTitle}>{listName}</Text>
          <Text style={styles.pageHeaderSubtitle}>Portföy Detayları</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>
      {positions.length === 0 && !loading ? (
        <View style={styles.emptyStateParentContainer}>
          {renderListHeader()}
          <View style={styles.emptyStateContainer}>
            <Ionicons name="file-tray-stacked-outline" size={64} color={AppColors.tertiaryText} />
            <Text style={styles.emptyStateTitle}>Portföy Boş</Text>
            <Text style={styles.emptyStateMessage}>Bu portföyde henüz pozisyon bulunmamaktadır.</Text>
            <TouchableOpacity style={styles.emptyStateButton} onPress={() => navigation.navigate('AddPosition', { listId })}>
              <Ionicons name="add-circle-outline" size={22} color={AppColors.primaryActionText} style={{ marginRight: 8 }} />
              <Text style={styles.emptyStateButtonText}>Pozisyon Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={positions}
          renderItem={renderItem}

          keyExtractor={(item) => (item.id ?? item.symbol).toString()}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchPositions(true)}
              colors={[AppColors.primaryAction]} tintColor={AppColors.primaryAction} />
          }
        />
      )}
      {positions.length > 0 && !loading && (
        <TouchableOpacity style={styles.addButtonFab} onPress={() => navigation.navigate('AddPosition', { listId })}>
          <Ionicons name="add-outline" size={32} color={AppColors.primaryActionText} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AppColors.background },
  fullScreenLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 15, fontSize: 16, color: AppColors.secondaryText },
  stickyHeader: { backgroundColor: AppColors.background, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 0.5, borderBottomColor: AppColors.separator, zIndex: 100, },
  backButton: { paddingLeft: 14, paddingRight: 10, paddingVertical: 4 },
  stickyHeaderTitleBlock: { flex: 1, alignItems: 'center' },
  pageHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: AppColors.primaryText },
  pageHeaderSubtitle: { fontSize: 14, color: AppColors.secondaryText },
  listContentContainer: { paddingBottom: 80 },
  positionsHeaderTitle: { fontSize: 20, fontWeight: '600', color: AppColors.primaryText, marginHorizontal: 16, marginBottom: 12, marginTop: 5 },

  summaryCard: { backgroundColor: AppColors.cardBackground, borderRadius: 12, padding: 20, marginHorizontal: 16, marginTop: 10, marginBottom: 20, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, },
  summaryCardTitle: { fontSize: 18, fontWeight: '600', color: AppColors.primaryText, marginBottom: 15, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: AppColors.separator },
  summaryRowLast: { borderBottomWidth: 0 },
  summaryIcon: { marginRight: 12 },
  summaryLabel: { fontSize: 16, color: AppColors.secondaryText, flex: 1 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: AppColors.primaryText },
  sectionCard: { backgroundColor: AppColors.cardBackground, borderRadius: 12, paddingVertical: 16, marginHorizontal: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, alignItems: 'center', },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: AppColors.primaryText, marginBottom: 5, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: AppColors.separator, width: '90%', textAlign: 'center', },
  distributionContainer: { flexDirection: 'row', alignItems: 'center', width: '100%', },
  distributionTableContainer: { flex: 1.5, paddingRight: 10, },
  pieChartContainer: { flex: 2, alignItems: 'center', justifyContent: 'center', },
  tableContainer: { width: '100%', marginLeft: 15, },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: AppColors.separator, paddingBottom: 6, marginBottom: 6, },
  tableHeaderText: { fontSize: 13, fontWeight: '600', color: AppColors.secondaryText, },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5, },
  tableCellLabelContainer: { flexDirection: 'row', alignItems: 'center', flex: 2, },
  legendColorBox: { width: 10, height: 10, borderRadius: 2, marginRight: 8, },
  tableCellText: { fontSize: 14, color: AppColors.primaryText, },
  tableCellPercentage: { fontSize: 14, color: AppColors.primaryText, fontWeight: '500', flex: 1, textAlign: 'right', },
  chartCenterLabelContainer: { justifyContent: 'center', alignItems: 'center' },
  chartCenterLabelValue: { fontSize: 16, fontWeight: 'bold', color: AppColors.primaryText },

  positionCard: { backgroundColor: AppColors.cardBackground, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, padding: 16, borderWidth: 1.5, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, },
  collapsedContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', },
  collapsedLeft: { flex: 1, },
  collapsedRight: { flex: 1, alignItems: 'flex-end', },
  symbol: { fontSize: 22, fontWeight: 'bold', color: AppColors.primaryText, marginBottom: 4, },
  metricLabel: { fontSize: 13, color: AppColors.secondaryText, marginBottom: 2, },
  marketValueText: { fontSize: 18, fontWeight: '600', color: AppColors.primaryText, },
  totalProfitLossText: { fontSize: 18, fontWeight: '600', },
  totalProfitLossPercent: { fontSize: 14, fontWeight: '500', },
  expandedContainer: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: AppColors.separator, },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, },
  detailLabel: { fontSize: 14, color: AppColors.secondaryText, },
  detailValue: { fontSize: 14, fontWeight: '500', color: AppColors.primaryText, },
  expandIconContainer: { position: 'absolute', bottom: 4, left: 0, right: 0, alignItems: 'center', opacity: 0.6, },

  comparisonContainer: { marginTop: 12, padding: 12, backgroundColor: '#F7F9FC', borderRadius: 8, },
  comparisonTitle: { fontSize: 14, fontWeight: '600', color: AppColors.primaryText, marginBottom: 8, },
  comparisonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, },
  comparisonLabelContainer: { flexDirection: 'row', alignItems: 'center' },
  comparisonIcon: { marginRight: 8, },
  comparisonLabel: { fontSize: 14, color: AppColors.secondaryText, },
  comparisonValue: { fontSize: 14, fontWeight: '600', },
  comparisonValueNeutral: { fontSize: 14, fontStyle: 'italic', color: AppColors.neutral, },

  actionContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: AppColors.separator, },
  actionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, },
  actionButtonText: { marginLeft: 8, fontSize: 14, fontWeight: '500', },

  emptyStateParentContainer: { flex: 1 },
  emptyStateContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, paddingBottom: 60, marginTop: -20 },
  emptyStateTitle: { fontSize: 22, fontWeight: '600', color: AppColors.primaryText, marginTop: 20, marginBottom: 10, textAlign: 'center' },
  emptyStateMessage: { fontSize: 15, color: AppColors.secondaryText, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
  emptyStateButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.primaryAction, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 25, elevation: 2, },
  emptyStateButtonText: { color: AppColors.primaryActionText, fontSize: 16, fontWeight: '500' },
  addButtonFab: { position: 'absolute', bottom: 25, right: 25, backgroundColor: AppColors.primaryAction, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, },
});

export default PortfolioDetailScreen;
