import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../services/config';

const COLORS = {
  background: '#F4F6F8',
  card: '#FFFFFF',
  primaryText: '#2C3E50',
  secondaryText: '#7F8C8D',
  action: '#3498DB',
  separator: '#E0E6ED',
};

const RiskHomeScreen = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState('');
  const navigation = useNavigation();

  const fetchLists = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) return;
      const res = await fetch(`${API_BASE_URL}/api/watchlists/${userId}?type=risk`);
      const data = await res.json();
      setLists(data);
    } catch (err) {
      console.error('Risk listeleri çekilemedi', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const createRiskPortfolio = async () => {
    if (!newPortfolioName.trim()) return;
    try {
      const userId = await AsyncStorage.getItem('userId');
      const res = await fetch(`${API_BASE_URL}/api/watchlists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPortfolioName.trim(), user_id: userId, type: 'risk' }),
      });
      const json = await res.json();
      setNewPortfolioName('');
      setModalVisible(false);
      await fetchLists();
      navigation.navigate('PortfolioRisk', { listId: json.id || json._id });
    } catch (err) {
      console.error('Risk portföyü oluşturulamadı', err);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('PortfolioRisk', { listId: item.id || item._id })}
    >
      <Text style={styles.itemText}>{item.name}</Text>
      <Ionicons name="chevron-forward" size={20} color={COLORS.secondaryText} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.action} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Risk Portföylerim</Text>
      {lists.length === 0 ? (
        <Text style={styles.emptyText}>Henüz oluşturulmuş risk portföyü bulunmuyor.</Text>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => (item.id || item._id).toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 10 }}
        />
      )}
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={20} color={COLORS.card} style={{ marginRight: 8 }} />
        <Text style={styles.addButtonText}>Yeni Portföy Oluştur</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Yeni Portföy</Text>
            <TextInput
              placeholder="Portföy adı"
              value={newPortfolioName}
              onChangeText={setNewPortfolioName}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.createButton]} onPress={createRiskPortfolio}>
                <Text style={styles.createButtonText}>Oluştur</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.primaryText,
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.separator,
    marginBottom: 12,
  },
  itemText: {
    fontSize: 16,
    color: COLORS.primaryText,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.secondaryText,
    textAlign: 'center',
    marginTop: 40,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.action,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  addButtonText: {
    color: COLORS.card,
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
  modalContainer: {
    width: '90%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: COLORS.primaryText,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.separator,
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    backgroundColor: COLORS.card,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: COLORS.separator,
  },
  createButton: {
    backgroundColor: COLORS.action,
  },
  cancelButtonText: {
    color: COLORS.primaryText,
  },
  createButtonText: {
    color: COLORS.card,
    fontWeight: 'bold',
  },
});

export default RiskHomeScreen;
