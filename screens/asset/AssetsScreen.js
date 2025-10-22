// screens/AssetsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { getCurrentPrice } from '../../services/fmpApi';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useLocalization } from '../../services/LocalizationContext';
import { API_BASE_URL } from '../../services/config';

const API_URL = `${API_BASE_URL}/api`;

const COLORS = {
  primary: '#1A237E',         
  primaryLight: '#E5E7EB',    
  secondary: '#10B981',       
  white: '#FFFFFF',           
  black: '#1F2937',           
  textPrimary: '#1F2937',     
  textSecondary: '#6B7280',   
  background: '#F8F9FA',      
  surface: '#FFFFFF',         
  border: '#E5E7EB',          
  success: '#10B981',         
  error: '#EF4444',           
  lightGray: '#E5E7EB',       
};

const AssetsScreen = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const navigation = useNavigation();
  const { t } = useLocalization();

  const fetchPortfolioSummary = async (id) => {
    try {
      const res = await axios.get(`${API_URL}/watchlists/${id}/stocks`);
      let cost = 0;
      let marketValue = 0;
      for (const pos of res.data) {
        const qty = Number(pos.quantity);
        const buyPrice = Number(pos.price);
        cost += qty * buyPrice;
        try {
          const current = await getCurrentPrice(pos.symbol);
          if (current !== null) {
            marketValue += qty * current;
          } else {
            marketValue += qty * buyPrice;
          }
        } catch (e) {
          console.error('Fiyat alınamadı:', e);
          marketValue += qty * buyPrice;
        }
      }
      const change = cost !== 0 ? ((marketValue - cost) / cost) * 100 : 0;
      return {
        totalValue: marketValue.toFixed(2),
        change: change.toFixed(2),
      };
    } catch (e) {
      console.error('Portföy özeti alınamadı:', e);
      return { totalValue: '0.00', change: '0.00' };
    }
  };

  const fetchPortfolios = async () => {
    setLoading(true); 
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Hata', 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.');
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API_URL}/watchlists/${userId}?type=portfolio`);

      const portfoliosWithData = await Promise.all(
        res.data.map(async (portfolio) => ({
          ...portfolio,
          ...(await fetchPortfolioSummary(portfolio.id)),
        }))
      );
      setPortfolios(portfoliosWithData);
    } catch (err) {
      console.error('Portföyler çekilemedi:', err.response ? err.response.data : err.message);
      Alert.alert('Hata', 'Portföyler yüklenirken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const createPortfolio = async () => {
    if (!newPortfolioName.trim()) {
      Alert.alert('Uyarı', 'Portföy adı boş bırakılamaz.');
      return;
    }
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Hata', 'Kullanıcı ID bulunamadı. Lütfen tekrar giriş yapın.');
        return;
      }
      await axios.post(`${API_URL}/watchlists`, {
        name: newPortfolioName.trim(),
        user_id: userId, 
        type: 'portfolio',
      });
      setNewPortfolioName('');
      setModalVisible(false);
      fetchPortfolios(); 
    } catch (err) {
      console.error('Yeni portföy oluşturulamadı:', err.response ? err.response.data : err.message);
      Alert.alert('Hata', 'Portföy oluşturulurken bir sorun oluştu.');
    }
  };

  useEffect(() => {

    const unsubscribe = navigation.addListener('focus', () => {
      fetchPortfolios();
    });

    return unsubscribe;
  }, [navigation]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.portfolioItem}
      onPress={() =>
        navigation.navigate('PortfolioDetail', { listId: item.id, listName: item.name })
      }
    >
      <View style={styles.portfolioInfo}>
        <Text style={styles.portfolioName}>{item.name}</Text>
        {item.totalValue && <Text style={styles.portfolioValue}>₺{item.totalValue}</Text>}
      </View>
      {item.change ? (
        <View style={styles.portfolioChangeContainer}>
          <Text
            style={[
              styles.portfolioChange,
              parseFloat(item.change) >= 0 ? styles.positiveChange : styles.negativeChange,
            ]}
          >
            {parseFloat(item.change) >= 0 ? '+' : ''}
            {item.change}%
          </Text>
          <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />
        </View>
      ) : (
        <Icon name="chevron-right" size={24} color={COLORS.textSecondary} />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        <Text style={styles.headerTitle}>{t('My Assets')}</Text>

        <FlatList
          data={portfolios}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContentContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="folder-outline" size={60} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>{t("You don't have any portfolios yet.")}</Text>
              <Text style={styles.emptySubText}>{t('You can create a new portfolio using the button below.')}</Text>
            </View>
          }
          ListFooterComponent={ 
            <TouchableOpacity
              style={styles.addPortfolioButton}
              onPress={() => setModalVisible(true)}
            >
              <Icon name="plus-circle-outline" size={22} color={COLORS.white} />
              <Text style={styles.addPortfolioButtonText}>{t('Create New Portfolio')}</Text>
            </TouchableOpacity>
          }

          ListFooterComponentStyle={{ marginTop: 20, marginBottom: 20 }} 
        />

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('Create New Portfolio')}</Text>
              <TextInput
                placeholder={t('Portfolio Name (e.g., My Stocks)')}
                placeholderTextColor={COLORS.textSecondary}
                style={styles.input}
                value={newPortfolioName}
                onChangeText={setNewPortfolioName}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.modalButtonText, styles.cancelButtonText]}>{t('Cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={createPortfolio}
                >
                  <Text style={[styles.modalButtonText, styles.createButtonText]}>{t('Create')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  listContentContainer: {
    paddingBottom: 20, 
  },
  portfolioItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  portfolioInfo: {
    flex: 1, 
  },
  portfolioName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  portfolioValue: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  portfolioChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  portfolioChange: {
    fontSize: 15,
    fontWeight: 'bold',
    marginRight: 8,
  },
  positiveChange: {
    color: COLORS.success,
  },
  negativeChange: {
    color: COLORS.error,
  },
  addPortfolioButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginHorizontal: 5, 
  },
  addPortfolioButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.surface,
    borderRadius: 15,
    padding: 25,
    alignItems: 'stretch',
    elevation: 5,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
    color: COLORS.textPrimary,
    marginBottom: 25,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  createButton: {
    backgroundColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
  },
  createButtonText: {
    color: COLORS.white,
  },

  emptyContainer: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,

  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default AssetsScreen;
