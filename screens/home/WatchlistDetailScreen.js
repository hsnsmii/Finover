import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Animated,
  Modal,
  Button,
  ActivityIndicator, 
} from 'react-native';
import axios from 'axios';
import { Swipeable } from 'react-native-gesture-handler';
import { MaterialIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../services/config';
import { getQuotes } from '../../services/fmpApi';

const WatchlistDetailScreen = ({ route }) => {

  const { listId } = route.params; 
  const [stocks, setStocks] = useState([]); 
  const [loading, setLoading] = useState(true); 

  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedSymbols, setSelectedSymbols] = useState([]);
  const [allAvailableStocks, setAllAvailableStocks] = useState([]); 

  const fetchWatchlistStocks = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/watchlists/${listId}/stocks`);
      const baseData = res.data || [];
      const symbols = baseData.map(s => s.symbol);
      const quotes = await getQuotes(symbols);
      const enriched = baseData.map(item => {
        const q = quotes.find(el => el.symbol === item.symbol) || {};
        return { ...item, ...q };
      });
      setStocks(enriched);
    } catch (err) {
      console.error('Liste içeriği çekilemedi', err);
      Alert.alert("Hata", "İzleme listesi verileri alınamadı.");
    }
  };

  const fetchAllAvailableStocks = async () => {
    try {

      const res = await axios.get(`${API_BASE_URL}/api/stocks`); 
      setAllAvailableStocks(res.data);
    } catch (err) {
      console.error('Tüm hisseler çekilemedi', err);

    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchWatchlistStocks(),
        fetchAllAvailableStocks()
      ]);
      setLoading(false);
    };
    loadData();
  }, [listId]); 

  const handleDelete = async (symbol) => {
    try {

      await axios.delete(`${API_BASE_URL}/api/watchlists/${listId}/stocks/${symbol}`);

      setStocks(currentStocks => currentStocks.filter(stock => stock.symbol !== symbol));
    } catch (err) {
      console.error("Hisse silinemedi", err);
      Alert.alert("Hata", `${symbol} hissesi silinirken bir sorun oluştu.`);
    }
  };

  const handleAddSelectedStocks = async () => {
    if (selectedSymbols.length === 0) return;

    try {

      await axios.post(`${API_BASE_URL}/api/watchlists/${listId}/stocks`, {
        symbols: selectedSymbols,
      });

      await fetchWatchlistStocks();
      handleCloseModal(); 
    } catch (err) {
      console.error("Hisseler eklenemedi", err);
      Alert.alert("Hata", "Seçilen hisseler listeye eklenirken bir sorun oluştu.");
    }
  };

  const availableStocksForModal = useMemo(() => {
    const existingSymbols = new Set(stocks.map(stock => stock.symbol));
    return allAvailableStocks.filter(stock => !existingSymbols.has(stock.symbol));
  }, [stocks, allAvailableStocks]);

  const toggleSelection = (symbol) => {
    setSelectedSymbols(current =>
      current.includes(symbol)
        ? current.filter(s => s !== symbol)
        : [...current, symbol]
    );
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedSymbols([]);
  };

  const renderRightActions = (progress, dragX, symbol) => {
    const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0], extrapolate: 'clamp' });
    const handlePress = () => {
       Alert.alert("Hisseyi Sil", `${symbol} sembollü hisseyi listenizden kaldırmak istediğinizden emin misiniz?`, [
          { text: "İptal", style: "cancel" },
          { text: "Sil", onPress: () => handleDelete(symbol), style: "destructive" }
        ]);
    };
    return (
      <TouchableOpacity onPress={handlePress} style={styles.deleteAction}>
        <Animated.View style={[styles.deleteButton, { transform: [{ scale }] }]}>
          <MaterialIcons name="delete-outline" size={28} color="white" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderStockItem = ({ item }) => {
    const isPositive = item.change >= 0;
    return (
      <Swipeable renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.symbol)} overshootRight={false}>
        <View style={styles.card}>
          <View style={styles.cardContent}>
            <View style={styles.leftContent}>
              <Image source={{ uri: item.imageUrl }} style={styles.stockImage} />
              <View style={styles.stockInfo}>
                <Text style={styles.stockSymbol}>{item.symbol}</Text>
                <Text style={styles.stockName}>{item.name}</Text>
              </View>
            </View>
            <View style={styles.rightContent}>
              <Text style={styles.stockPrice}>${item.price}</Text>
              <View style={[styles.changeBox, { backgroundColor: isPositive ? '#E8F5E9' : '#FCE8E6' }]}>
                <Text style={[styles.stockChange, { color: isPositive ? '#1B873D' : '#C53929' }]}>
                  {isPositive ? '+' : ''}{item.change?.toFixed(2)} ({item.changePercentage?.toFixed(2)}%)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Swipeable>
    );
  };

  const renderModalItem = ({ item }) => {
    const isSelected = selectedSymbols.includes(item.symbol);
    return (
      <TouchableOpacity onPress={() => toggleSelection(item.symbol)} style={styles.modalItemContainer}>
        <View style={styles.modalItemInfo}>
          <Text style={styles.modalItemSymbol}>{item.symbol}</Text>
          <Text style={styles.modalItemName}>{item.name}</Text>
        </View>
        <MaterialIcons name={isSelected ? 'check-box' : 'check-box-outline-blank'} size={24} color={isSelected ? '#1B873D' : '#ccc'} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator style={{ flex: 1, justifyContent: 'center' }} size="large" color="#0000ff" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>İzleme Listem</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
            <MaterialIcons name="add" size={32} color="#212121" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={stocks}
        keyExtractor={(item) => item.symbol}
        renderItem={renderStockItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        ListEmptyComponent={<Text style={styles.emptyListText}>Listenizde hiç hisse yok. Eklemek için '+' ikonuna dokunun.</Text>}
      />

      <Modal visible={isModalVisible} animationType="slide" onRequestClose={handleCloseModal}>
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Hisse Ekle</Text>
            <TouchableOpacity onPress={handleCloseModal}>
              <MaterialIcons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableStocksForModal}
            renderItem={renderModalItem}
            keyExtractor={(item) => item.symbol}
            ListEmptyComponent={<Text style={styles.emptyListText}>Eklenecek yeni hisse bulunmuyor.</Text>}
          />
          <View style={styles.modalFooter}>
            <Button
              title={`Seçilenleri Ekle (${selectedSymbols.length})`}
              onPress={handleAddSelectedStocks}
              disabled={selectedSymbols.length === 0}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({

  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#212121' },
  addButton: { padding: 5 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 12, shadowColor: '#9E9E9E', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5, marginHorizontal: 16 }, 
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  leftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rightContent: { alignItems: 'flex-end' },
  stockImage: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#EAEAEA' },
  stockInfo: { justifyContent: 'center', flex: 1 },
  stockSymbol: { fontSize: 18, fontWeight: 'bold', color: '#212121' },
  stockName: { fontSize: 14, color: '#666666', marginTop: 2 },
  stockPrice: { fontSize: 18, fontWeight: '600', color: '#212121' },
  changeBox: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginTop: 4, minWidth: 90, alignItems: 'center' },
  stockChange: { fontSize: 14, fontWeight: '600' },
  deleteAction: { backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: 16, marginVertical: 6, marginBottom: 12, marginRight: 16}, 
  deleteButton: { justifyContent: 'center', alignItems: 'center' },
  emptyListText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888888' },

  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 24, fontWeight: 'bold' },
  modalItemContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalItemInfo: {},
  modalItemSymbol: { fontSize: 18, fontWeight: 'bold' },
  modalItemName: { fontSize: 14, color: '#666', marginTop: 2 },
  modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee' },
});

export default WatchlistDetailScreen;
