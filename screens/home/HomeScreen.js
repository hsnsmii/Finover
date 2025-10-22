import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  StyleSheet,
  LayoutAnimation,
  UIManager,
  Platform,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from '@react-navigation/native';
import { useLocalization } from '../../services/LocalizationContext';
import { API_BASE_URL } from '../../services/config';

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

const indexInfo = {
  'XU100.IS': { name: 'BIST 100', currency: '₺' },
  '^NDX': { name: 'NASDAQ 100', currency: '$' },
};

const borsaImageUrls = [
    'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?q=80&w=1932&auto=format&fit=crop',
];

const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yıl önce";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ay önce";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " gün önce";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " sa. önce";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " dk. önce";
    return Math.floor(seconds) + " sn. önce";
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useLocalization();

  const [watchlists, setWatchlists] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [popularStocks, setPopularStocks] = useState([]);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState(null);
  const [updatedListName, setUpdatedListName] = useState('');

  const [expandedNewsId, setExpandedNewsId] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchWatchlists(),
        fetchMarketData(),
        fetchPopularStocks(),
        fetchNews()
      ]);
    } catch (error) {
      console.error("Veri çekme sırasında genel hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlists = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.warn('Kullanıcı ID bulunamadı.');
        return;
      }
      const res = await axios.get(`${API_BASE_URL}/api/watchlists/${userId}?type=watchlist`);
      setWatchlists(res.data);
    } catch (err) {
      console.error('Takip listesi çekme hatası', err);
    }
  };

  const createWatchlist = async () => {
    if (!newListName.trim()) {
      Alert.alert('Hata', 'Liste adı boş olamaz.');
      return;
    }
    try {
      const userId = await AsyncStorage.getItem('userId');
      const res = await axios.post(`${API_BASE_URL}/api/watchlists`, {
        name: newListName.trim(),
        user_id: userId,
        type: 'watchlist',
      });
      setWatchlists(prev => [...prev, res.data]);
      setNewListName('');
      setCreateModalVisible(false);
    } catch (err) {
      Alert.alert('Hata', 'Liste oluşturulamadı.');
      console.error(err);
    }
  };

  const deleteWatchlist = async (listId) => {

    try {
      await axios.delete(`${API_BASE_URL}/api/watchlists/${listId}`);
      setWatchlists(current => current.filter(l => l.id !== listId));
    } catch (err) {
      console.error('Liste silinemedi', err);
      Alert.alert('Hata', 'Liste silinirken bir sorun oluştu.');
    }

  };

  const renameWatchlist = async () => {
    if (!updatedListName.trim() || !editingList) return;

    Alert.alert("Yapım Aşamasında", "Bu özellik yakında eklenecektir.");
    setEditModalVisible(false);

  };

  const fetchMarketData = async () => {
    try {
      const res = await axios.get('https://financialmodelingprep.com/api/v3/quote/XU100.IS,^NDX?apikey=obHajA78aHmRpFpviomn8XALGDAoonj3');
      setMarketData(res.data || []);
    } catch (err) {
      console.error("Piyasa verisi çekme hatası", err);
      setMarketData([]);
    }
  };

  const fetchPopularStocks = async () => {
    try {
      const res = await axios.get('https://financialmodelingprep.com/api/v3/quotes/ist?apikey=obHajA78aHmRpFpviomn8XALGDAoonj3');
      const sorted = res.data
        .sort((a, b) => b.changesPercentage - a.changesPercentage)
        .slice(0, 10);
      setPopularStocks(sorted);
    } catch (err) {
      console.error("Popüler hisse çekme hatası", err);
      setPopularStocks([]);
    }
  };

  const fetchNews = async () => {
    try {
      const res = await axios.get('https://financialmodelingprep.com/api/v3/stock_news?limit=5&apikey=obHajA78aHmRpFpviomn8XALGDAoonj3');
      const newsWithImages = res.data.map((item, index) => ({
        ...item,
        id: `news-${index}`, 
        imageUrl: borsaImageUrls[index % borsaImageUrls.length], 
      }));
      setNews(newsWithImages);
    } catch (err) {
      console.error("Haber çekme hatası", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const openWatchlist = (listId) => {
    navigation.navigate('WatchlistDetail', { listId });
  };

  const toggleNewsExpansion = (newsId) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedNewsId(expandedNewsId === newsId ? null : newsId);
  };

  const handleWatchlistOptions = (list) => {
    Alert.alert(
      `'${list.name}' Listesi`,
      "Yapmak istediğiniz işlemi seçin:",
      [
        { text: "Sil", onPress: () => deleteWatchlist(list.id), style: "destructive" },
        { text: "Adını Değiştir", onPress: () => { setEditingList(list); setUpdatedListName(list.name); setEditModalVisible(true); } },
        { text: "İptal", style: "cancel" },
      ]
    );
  };

  const COLORS = {
    primary: '#1A237E',
    background: '#F7F8FA',
    textDark: '#1F2937',
    textLight: '#6B7280',
    white: '#FFFFFF',
    green: '#10B981',
    red: '#EF4444',
    border: '#E5E7EB',
  };

  const styles = StyleSheet.create({
      container: {
          flex: 1,
          backgroundColor: COLORS.primary
      },
      scrollViewContent: {
          backgroundColor: COLORS.background
      },
      header: {
          backgroundColor: COLORS.primary,
          paddingTop: 20,
          paddingBottom: 24,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
      },
      headerTop: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
      },
      headerGreeting: {
          fontSize: 16,
          color: COLORS.white,
          opacity: 0.8,
          fontWeight: '400'
      },
      headerTitle: {
          fontSize: 32,
          fontWeight: 'bold',
          color: COLORS.white,
          letterSpacing: 1
      },
      marketOverview: {
          flexDirection: 'row',
          justifyContent: 'space-around',
          gap: 12
      },
      marketCard: {
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 16,
      },
      marketCardTitle: {
          color: COLORS.white,
          fontSize: 14,
          fontWeight: '500',
          opacity: 0.9
      },
      marketCardValue: {
          color: COLORS.white,
          fontSize: 22,
          fontWeight: 'bold',
          marginVertical: 8
      },
      marketCardTrend: {
          flexDirection: 'row',
          alignItems: 'center'
      },
      trendUp: {
          color: COLORS.green,
          fontSize: 14,
          fontWeight: 'bold',
          marginLeft: 4
      },
      trendDown: {
          color: COLORS.red,
          fontSize: 14,
          fontWeight: 'bold',
          marginLeft: 4
      },
      section: {
          paddingHorizontal: 20,
          marginTop: 24
      },
      sectionHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
      },
      sectionTitle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: COLORS.textDark
      },
      sectionTitleIcon: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8
      },
      stockCard: {
          backgroundColor: COLORS.white,
          borderRadius: 16,
          padding: 16,
          marginRight: 12,
          width: 160,
          shadowColor: '#959DA5',
          shadowOffset: {
              width: 0,
              height: 5
          },
          shadowOpacity: 0.1,
          shadowRadius: 15,
          elevation: 5,
          borderWidth: 1,
          borderColor: COLORS.border,
      },
      stockSymbol: {
          fontSize: 18,
          fontWeight: 'bold',
          color: COLORS.textDark,
          marginBottom: 4
      },
      stockName: {
          fontSize: 12,
          color: COLORS.textLight,
          marginBottom: 12,
          height: 30
      },
      stockPriceContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
      },
      stockPrice: {
          fontSize: 16,
          fontWeight: 'bold',
          color: COLORS.textDark
      },
      stockChange: {
          fontSize: 13,
          fontWeight: 'bold'
      },
      stockChangePositive: {
          color: COLORS.green
      },
      stockChangeNegative: {
          color: COLORS.red
      },
      addButton: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: COLORS.primary,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 20,
          gap: 6
      },
      addText: {
          color: COLORS.white,
          fontSize: 14,
          fontWeight: '600'
      },
      watchlistGrid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: 16
      },
      watchlistCard: {
          backgroundColor: COLORS.white,
          borderRadius: 16,
          width: (width - 56) / 2,
          shadowColor: '#959DA5',
          shadowOffset: {
              width: 0,
              height: 4
          },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 4,
          borderWidth: 1,
          borderColor: COLORS.border,
          padding: 16,
      },
      watchlistCardContent: {
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12
      },
      watchlistName: {
          fontSize: 15,
          fontWeight: '600',
          color: COLORS.textDark,
          textAlign: 'center'
      },
      optionsButton: {
          position: 'absolute',
          top: 4,
          right: 4,
          padding: 8,
          borderRadius: 20
      },
      newsCard: {
          backgroundColor: 'white',
          borderRadius: 20,
          marginBottom: 20,
          shadowColor: '#959DA5',
          shadowOffset: {
              width: 0,
              height: 5
          },
          shadowOpacity: 0.1,
          shadowRadius: 15,
          elevation: 8,
          overflow: 'hidden',
      },
      newsImageContainer: {
          height: 180,
      },
      newsImageBackground: {
          width: '100%',
          height: '100%',
          justifyContent: 'flex-end',
      },
      imageOverlay: {
          ...StyleSheet.absoluteFillObject,
      },
      newsContentOverlay: {
          padding: 16,
      },
      newsTitle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: 'white',
          textShadowColor: 'rgba(0, 0, 0, 0.75)',
          textShadowOffset: {
              width: -1,
              height: 1
          },
          textShadowRadius: 10,
          marginBottom: 8,
      },
      newsMetaContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          opacity: 0.9,
      },
      newsMetaText: {
          fontSize: 12,
          color: 'white',
          fontWeight: '600',
          marginLeft: 4,
          textShadowColor: 'rgba(0, 0, 0, 0.75)',
          textShadowOffset: {
              width: 0,
              height: 1
          },
          textShadowRadius: 5,
      },
      newsBody: {
          paddingHorizontal: 16,
          paddingTop: 16,
      },
      newsDescription: {
          fontSize: 15,
          lineHeight: 24,
          color: '#475569',
      },
      newsActions: {
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: 16,
          paddingTop: 12,
      },
      inceleButtonText: {
          fontSize: 14,
          fontWeight: 'bold',
          color: COLORS.primary,
      },
      modalContainer: {
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
      },
      modalContent: {
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          shadowColor: '#000',
          shadowOffset: {
              width: 0,
              height: 10
          },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
      },
      modalTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: COLORS.textDark,
          marginBottom: 16,
          textAlign: 'center'
      },
      modalInput: {
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          padding: 16,
          fontSize: 16,
          marginBottom: 20,
          backgroundColor: '#f8fafc',
      },
      modalActions: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
      },
      modalButton: {
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 12,
          flex: 1,
          alignItems: 'center',
          marginHorizontal: 8
      },
      cancelButton: {
          backgroundColor: '#f1f5f9'
      },
      createButton: {
          backgroundColor: COLORS.primary
      },
      cancelButtonText: {
          color: COLORS.textLight,
          fontWeight: '600'
      },
      createButtonText: {
          color: 'white',
          fontWeight: '600'
      },
      loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 40,
          width: '100%'
      },
      emptyState: {
          textAlign: 'center',
          color: COLORS.textLight,
          fontSize: 16,
          paddingVertical: 40,
          width: '100%'
      },
  });
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollViewContent}>

        {}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerGreeting}>{t('Welcome')}</Text>
              <Text style={styles.headerTitle}>FINOVER</Text>
            </View>
          </View>

          <View style={styles.marketOverview}>
            {marketData && marketData.length > 0 ? (
              marketData.map((item, index) => (
                <View key={index} style={styles.marketCard}>
                  <Text style={styles.marketCardTitle}>{indexInfo[item.symbol]?.name || item.symbol}</Text>
                  <Text style={styles.marketCardValue}>
                    {item.price?.toFixed(2)}
                    <Text style={{fontSize: 14}}>{indexInfo[item.symbol]?.currency}</Text>
                  </Text>
                  <View style={styles.marketCardTrend}>
                    <Ionicons name={item.changesPercentage > 0 ? "caret-up" : "caret-down"} size={16} color={item.changesPercentage > 0 ? COLORS.green : COLORS.red} />
                    <Text style={item.changesPercentage > 0 ? styles.trendUp : styles.trendDown}>{item.changesPercentage?.toFixed(2)}%</Text>
                  </View>
                </View>
              ))
            ) : ( <View style={styles.loadingContainer}><ActivityIndicator size="small" color="white" /></View> )}
          </View>
        </View>

        {}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleIcon}>
              <MaterialCommunityIcons name="trending-up" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>{t('Top Gainers')}</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularStocks.length > 0 ? (
              popularStocks.map((stock, index) => (
                <TouchableOpacity key={index} style={styles.stockCard}>
                  <Text style={styles.stockSymbol}>{stock.symbol.replace('.IS', '')}</Text>
                  <Text style={styles.stockName} numberOfLines={2}>{stock.name}</Text>
                  <View style={styles.stockPriceContainer}>
                    <Text style={styles.stockPrice}>{stock.price?.toFixed(2)} ₺</Text>
                    <Text style={[ styles.stockChange, stock.changesPercentage > 0 ? styles.stockChangePositive : styles.stockChangeNegative ]}>
                      {stock.changesPercentage > 0 ? '+' : ''}{stock.changesPercentage?.toFixed(1)}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : ( !loading && <Text style={styles.emptyState}>Popüler hisse bulunamadı.</Text> )}
          </ScrollView>
        </View>

        {}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleIcon}>
              <FontAwesome5 name="bookmark" solid size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>{t('My Watchlists')}</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => setCreateModalVisible(true)}>
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.addText}>{t('New List')}</Text>
            </TouchableOpacity>
          </View>
          {loading && watchlists.length === 0 ? ( <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View> ) 
            : watchlists.length > 0 ? (
              <View style={styles.watchlistGrid}>
                {watchlists.map((list) => (
                  <TouchableOpacity key={list.id} activeOpacity={0.8} onPress={() => openWatchlist(list.id)} style={styles.watchlistCard}>
                    <TouchableOpacity style={styles.optionsButton} onPress={() => handleWatchlistOptions(list)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <FontAwesome5 name="ellipsis-h" size={16} color={COLORS.textLight} />
                    </TouchableOpacity>
                    <View style={styles.watchlistCardContent}>
                      <FontAwesome5 name="list-alt" size={32} color={COLORS.primary} />
                      <Text style={styles.watchlistName}>{list.name}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              ) : ( <Text style={styles.emptyState}>{t('No watchlists yet')}</Text> )}
        </View>

        {}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleIcon}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={22} color={COLORS.textDark} />
              <Text style={styles.sectionTitle}>{t('Market News')}</Text>
            </View>
          </View>
          {news.length > 0 ? (
            news.map((newsItem) => {
              const isExpanded = expandedNewsId === newsItem.id;
              return (
                <View key={newsItem.id} style={styles.newsCard}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => toggleNewsExpansion(newsItem.id)}>
                    <View style={styles.newsImageContainer}>
                      <ImageBackground source={{ uri: newsItem.imageUrl }} style={styles.newsImageBackground} resizeMode="cover">
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.imageOverlay} />
                        <View style={styles.newsContentOverlay}>
                          <Text style={styles.newsTitle} numberOfLines={2}>{newsItem.title}</Text>
                          <View style={styles.newsMetaContainer}>
                            <MaterialCommunityIcons name="newspaper-variant-multiple" size={14} color="white" />
                            <Text style={styles.newsMetaText}>{newsItem.site}</Text>
                            <Text style={styles.newsMetaText}> • </Text>
                            <MaterialCommunityIcons name="clock-time-four-outline" size={14} color="white" />
                            <Text style={styles.newsMetaText}>{formatTimeAgo(newsItem.publishedDate)}</Text>
                          </View>
                        </View>
                      </ImageBackground>
                    </View>
                  </TouchableOpacity>
                  {isExpanded && (
                     <View style={styles.newsBody}>
                        <Text style={styles.newsDescription}>{newsItem.text}</Text>
                    </View>
                  )}
                  <View style={styles.newsActions}>
                    <TouchableOpacity onPress={() => toggleNewsExpansion(newsItem.id)}>
                      <Text style={styles.inceleButtonText}>{isExpanded ? 'Kapat' : 'Haberi İncele'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : ( !loading && <Text style={styles.emptyState}>Haber bulunamadı.</Text> )}
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {}
      <Modal transparent visible={createModalVisible} animationType="fade" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('Create New List')}</Text>
            <TextInput value={newListName} onChangeText={setNewListName} placeholder={t('Enter list name')} style={styles.modalInput} placeholderTextColor="#9ca3af" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setCreateModalVisible(false)}><Text style={styles.cancelButtonText}>{t('Cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.createButton]} onPress={createWatchlist}><Text style={styles.createButtonText}>{t('Create')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={editModalVisible} animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('Edit List')}</Text>
            <TextInput value={updatedListName} onChangeText={setUpdatedListName} placeholder={t('Enter new list name')} style={styles.modalInput} placeholderTextColor="#9ca3af" autoFocus />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setEditModalVisible(false)}><Text style={styles.cancelButtonText}>{t('Cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.createButton]} onPress={renameWatchlist}><Text style={styles.createButtonText}>{t('Save')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

export default HomeScreen;
