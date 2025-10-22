import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { API_BASE_URL } from '../../services/config';

const WatchlistScreen = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const userId = await AsyncStorage.getItem('userId');
        const response = await axios.get(`${API_BASE_URL}/api/watchlists/${userId}`);
        setLists(response.data);
      } catch (err) {
        console.error('Liste çekilemedi:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLists();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => navigation.navigate('WatchlistDetail', { listId: item.id, listName: item.name })}
    >
      <Text style={styles.listName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ marginTop: 100 }} size="large" />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Takip Listelerim</Text>
      <FlatList
        data={lists}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  listItem: { padding: 16, backgroundColor: '#f2f2f2', marginBottom: 8, borderRadius: 6 },
  listName: { fontSize: 18 },
});

export default WatchlistScreen;
