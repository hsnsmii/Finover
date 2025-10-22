// screens/AddPositionScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import axios from 'axios';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getSelectedStocks, getPriceOnDate } from '../../services/fmpApi';
import { API_BASE_URL } from '../../services/config';

const AddPositionScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { listId, symbol: editSymbol, isEdit } = route.params || {};

  const [symbol, setSymbol] = useState(editSymbol || '');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [showStocks, setShowStocks] = useState(false);

  // Stock list
  useEffect(() => {
    const fetchStocks = async () => {
      const data = await getSelectedStocks();
      setStocks(data);
      setFilteredStocks(data);
    };
    fetchStocks();
  }, []);

  // Price fetch on symbol/date
  useEffect(() => {
    const fetchPrice = async () => {
      if (!symbol) return;
      try {
        const p = await getPriceOnDate(symbol, date);
        if (p !== null) setPrice(String(p));
      } catch (err) {
        console.error('Fiyat otomatik getirilemedi:', err);
      }
    };
    fetchPrice();
  }, [symbol, date]);

  // If editing: fill fields
  useEffect(() => {
    const fetchExisting = async () => {
      if (isEdit && listId && editSymbol) {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/watchlists/${listId}/stocks`);
          const match = res.data.find((s) => s.symbol === editSymbol);
          if (match) {
            setSymbol(match.symbol);
            setQuantity(String(match.quantity));
            setPrice(String(match.price));
            setNote(match.note || '');
            setDate(match.date ? new Date(match.date) : new Date());
          }
        } catch (err) {
          console.error('Düzenleme verisi alınamadı:', err);
        }
      }
    };
    fetchExisting();
  }, [isEdit, listId, editSymbol]);

  // Arama fonksiyonu
  const handleSearch = (text) => {
    setSearchText(text);
    setShowStocks(true);
    const filtered = stocks.filter((s) =>
      s.symbol.toLowerCase().includes(text.toLowerCase()) ||
      s.companyName.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredStocks(filtered);
  };

  // Kayıt/güncelle
  const handleAdd = async () => {
    if (!symbol || !quantity || !price) {
      Alert.alert('Eksik bilgi', 'Lütfen sembol, miktar ve fiyat giriniz.');
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/watchlists/${listId}/stocks`, {
        symbol: symbol.toUpperCase(),
        quantity: parseFloat(quantity),
        price: parseFloat(price),
        note,
        date: date.toISOString().split('T')[0],
      });
      Alert.alert('Başarılı', isEdit ? 'Pozisyon güncellendi.' : 'Pozisyon kaydedildi.');
      navigation.goBack();
    } catch (err) {
      console.error('Pozisyon eklenemedi:', err);
      Alert.alert('Hata', 'Pozisyon eklenemedi.');
    }
  };

  // Stok seç
  const handleSelectStock = (item) => {
    setSymbol(item.symbol);
    setShowStocks(false);
    setSearchText(item.symbol);
  };

  // Hisse arama kutusu altındaki liste
  const renderStockItem = ({ item }) => (
    <TouchableOpacity
      style={styles.stockItem}
      onPress={() => handleSelectStock(item)}
    >
      <Text style={styles.symbol}>{item.symbol}</Text>
      <Text numberOfLines={1} style={{ color: '#777', fontSize: 13 }}>{item.companyName}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#F8FAFB' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEdit ? 'Pozisyonu Düzenle' : 'Pozisyon Ekle'}</Text>
          </View>

          {/* Hisse arama */}
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.label}>Hisse Seçimi</Text>
            <TextInput
              placeholder="Hisse ara (örn: AKBNK)"
              style={styles.input}
              value={searchText}
              onChangeText={handleSearch}
              onFocus={() => setShowStocks(true)}
              autoCapitalize="characters"
            />
            {showStocks && filteredStocks.length > 0 && (
              <FlatList
                data={filteredStocks.slice(0, 8)}
                keyExtractor={(item) => item.symbol}
                renderItem={renderStockItem}
                style={styles.stockList}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>

          {/* Sembolden sonra açılan alanlar */}
          {symbol !== '' && (
            <View style={styles.animatedSection}>
              <Text style={styles.selectedText}>Seçilen hisse: <Text style={{ color: "#3b82f6" }}>{symbol}</Text></Text>
              <Text style={styles.label}>Tarih</Text>
              <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.datePickerBtn}>
                <Text style={styles.dateText}>{date.toLocaleDateString()}</Text>
                <Ionicons name="calendar" size={18} color="#007AFF" />
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowPicker(false);
                    if (selectedDate) setDate(selectedDate);
                  }}
                />
              )}

              <Text style={styles.label}>Adet</Text>
              <TextInput
                placeholder="Miktar girin"
                style={styles.input}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />

              <Text style={styles.label}>Alış Fiyatı</Text>
              <TextInput
                placeholder="Alış fiyatı"
                style={styles.input}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={styles.label}>Not (opsiyonel)</Text>
              <TextInput
                placeholder="Ek bilgi"
                style={[styles.input, { marginBottom: 10 }]}
                value={note}
                onChangeText={setNote}
                maxLength={64}
              />

              <TouchableOpacity style={styles.button} onPress={handleAdd}>
                <Text style={styles.buttonText}>{isEdit ? 'Kaydet' : 'Pozisyonu Ekle'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    marginTop: 40,
    backgroundColor: '#F8F9FA', 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  backButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#E5E7EB', 
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937', 
    flex: 1,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 14,
    color: '#6B7280', 
    marginBottom: 4,
    marginLeft: 2,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB', 
    backgroundColor: '#FFFFFF', 
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#1F2937', 
  },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCEEF8', 
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
    alignSelf: 'flex-start',
    gap: 7,
  },
  dateText: {
    fontSize: 15,
    color: '#1A237E', 
    marginRight: 2,
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#10B981', 
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#10B981', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },
  buttonText: {
    color: '#FFFFFF', 
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  stockList: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 8,
    borderColor: '#E5E7EB', 
    borderWidth: 1,
    maxHeight: 220,
    marginBottom: 8,
    shadowColor: '#9CA3AF', 
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
  stockItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomColor: '#F3F4F6', 
    borderBottomWidth: 1,
  },
  symbol: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#1A237E', 
    marginBottom: 2,
  },
  selectedText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
    color: '#374151', 
    letterSpacing: 0.2,
  },
  animatedSection: {
    backgroundColor: '#FFFFFF', 
    borderRadius: 12,
    padding: 18,
    marginBottom: 6,
    shadowColor: '#D1D5DB', 
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 2,
  },
});

export default AddPositionScreen;
