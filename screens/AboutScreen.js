import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useLocalization } from '../services/LocalizationContext';

const COLORS = {
  background: '#F8F9FA',
  primary: '#1A237E',
  text: '#1F2937',
  textSecondary: '#6B7280',
};

const AboutScreen = ({ navigation }) => {
  const { t } = useLocalization();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <FontAwesome name="arrow-left" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('About')}</Text>
        <View style={styles.backButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.paragraph}>
          Finover, yatırımcılara modern piyasa verilerini kolay anlaşılır bir
          şekilde sunmak amacıyla geliştirilmiş bir finans uygulamasıdır.
        </Text>
        <Text style={styles.paragraph}>
          Uygulama, yapay zeka destekli analizler ile portföyünüzü takip etmenizi
          ve risk yönetimi yapmanızı kolaylaştırır.
        </Text>
        <Text style={styles.paragraph}>
          Ekibimiz yatırım sürecinizi basitleştirmek için sürekli olarak yeni
          özellikler üzerinde çalışmaktadır.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: COLORS.primary },
  content: { padding: 16 },
  paragraph: { fontSize: 16, color: COLORS.text, lineHeight: 24, marginBottom: 16 },
});

export default AboutScreen;
