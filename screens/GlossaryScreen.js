import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  SectionList,
  StatusBar,
  TouchableOpacity, 
} from 'react-native';

import FontAwesome from 'react-native-vector-icons/FontAwesome';

const glossaryData = [
  {
    title: 'Bölüm 1: Hisse Değerlendirme Terimleri',
    data: [
      {
        id: 'fk',
        title: 'F/K Oranı (Fiyat/Kazanç Oranı)',
        definition:
          'Hisse senedi fiyatının, şirketin hisse başına düşen yıllık kârına bölünmesiyle bulunur.',
        simple:
          "Bir hissenin, elde ettiği kâra göre 'pahalı' mı yoksa 'ucuz' mu olduğunu anlamaya yarayan bir göstergedir. Düşük F/K oranı, hissenin kârına göre ucuz olabileceğini düşündürebilir.",
        where: 'Piyasa sekmesinde hisse detaylarında bu oranı görebilirsin.',
      },
      {
        id: 'beta',
        title: 'Beta Değeri (β)',
        definition:
          'Bir hissenin, genel piyasa (BİST 100 Endeksi gibi) hareketlerine karşı ne kadar hassas olduğunu gösterir.',
        simple:
          'Beta = 1 ise: Hisse, piyasa ile aynı oranda hareket eder.\nBeta > 1 ise: Hisse, piyasadan daha fazla hareket eder (daha riskli).\nBeta < 1 ise: Hisse, piyasadan daha az hareket eder (daha istikrarlı).',
        where:
          'Piyasa ve Risk sekmelerinde hisse detaylarında bu değeri bulabilirsin.',
      },
    ],
  },
  {
    title: 'Bölüm 2: Risk ve Analiz Göstergeleri',
    data: [
      {
        id: 'risk',
        title: 'Risk Puanı / Risk Durumu',
        definition:
          "Finover'ın yapay zeka algoritmasının; bir hissenin fiyat hareketleri, finansal durumu ve piyasa koşullarını analiz ederek oluşturduğu bir değerlendirmedir.",
        simple:
          "O hisseye yatırım yapmanın ne kadar 'güvenli' veya 'dalgalı' olabileceği hakkında sana hızlı bir fikir verir (Düşük, Orta, Yüksek Risk gibi).",
        where:
          'Piyasa sekmesinde hisse detaylarında ve Risk sekmesinde portföyün için bu değerlendirmeyi göreceksin.',
      },
      {
        id: 'volatilite',
        title: 'Volatilite',
        definition:
          'Bir hisse senedi fiyatının belirli bir zaman dilimindeki dalgalanma (oynaklık) derecesidir.',
        simple:
          'Fiyatların ne kadar hızlı ve ne kadar sert bir şekilde inip çıktığını gösterir. Yüksek volatilite, yüksek risk ama aynı zamanda yüksek kazanç fırsatı anlamına gelebilir.',
        where: 'Risk sekmesinde hisse bazında detaylı oranlar arasında yer alır.',
      },
      {
        id: 'rsi',
        title: 'RSI (Göreceli Güç Endeksi)',
        definition:
          'Bir hissenin son dönemdeki fiyat hareketlerinin hızını ve değişimini ölçen bir teknik göstergedir.',
        simple:
          "Hissenin 'aşırı alınmış' mı (fiyatı şişmiş) yoksa 'aşırı satılmış' mı (fiyatı düşmüş) olduğunu anlamaya yarar. Genellikle 70 üzeri 'aşırı alım', 30 altı 'aşırı satım' olarak yorumlanır.",
        where:
          'Risk sekmesinde hisse detaylarında bu göstergeyi bulabilirsin.',
      },
      {
        id: 'sma',
        title: 'SMA (Basit Hareketli Ortalama)',
        definition:
          'Bir hissenin belirli bir dönemdeki (örneğin son 20 gün) ortalama kapanış fiyatını gösterir.',
        simple:
          'Fiyat grafiğindeki anlık iniş çıkışları yumuşatarak hissenin genel gidişatını (trendini) daha net görmeni sağlar.',
        where:
          'Risk sekmesinde hisse detaylarında bu göstergeyi görebilirsin.',
      },
    ],
  },
];

const TermItem = ({ title, definition, simple, where }) => (
  <View style={styles.card}>
    <Text style={styles.termTitle}>{title}</Text>

    <Text style={styles.termContent}>
      <Text style={styles.label}>Tanımı: </Text>
      {definition}
    </Text>

    <Text style={styles.termContent}>
      <Text style={styles.label}>Basitçe: </Text>
      {simple}
    </Text>

    {where && (
      <View style={styles.whereContainer}>
        <Text style={styles.whereText}>
          <Text style={styles.label}>Finover'da Nerede: </Text>
          {where}
        </Text>
      </View>
    )}
  </View>
);

const GlossaryScreen = ({ navigation }) => {
  const ListHeader = () => (
    <View style={styles.headerContainer}>
      {}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <FontAwesome name="arrow-left" size={20} color="#1A237E" />
        </TouchableOpacity>
        <Text style={styles.mainTitle}>Finover Yatırımcı Sözlüğü</Text>
        {}
        <View style={styles.backButton} />
      </View>

      <Text style={styles.introText}>
        Yatırım dünyasına ilk adımını atarken bazı terimler karmaşık gelebilir.
        Bu sözlük, Finover'ı kullanırken karşına çıkacak temel kavramları en
        basit dille anlaman için hazırlandı.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {}
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <SectionList
        sections={glossaryData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TermItem {...item} />}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
};

const COLORS = {
  primary: '#1A237E',          
  secondary: '#10B981',        
  background: '#F8F9FA',       
  cardBackground: '#FFFFFF',   
  text: '#1F2937',             
  textSecondary: '#6B7280',    
  border: '#E5E7EB',           
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerContainer: {
    marginBottom: 16,
    paddingTop: 16,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 22, 
    fontWeight: 'bold',
    color: COLORS.secondary,

    textAlign: 'center',

    flex: 1,
  },
  introText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSecondary,
    textAlign: 'center', 
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  termTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  termContent: {
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.text,
    marginBottom: 10,
  },
  label: {
    fontWeight: '700',
    color: COLORS.secondary,
  },
  whereContainer: {
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    paddingLeft: 12,
    backgroundColor: '#f7f9fc', 
    paddingVertical: 8,
    borderRadius: 4,
  },
  whereText: {
    fontSize: 13,
    color: COLORS.primary,
    fontStyle: 'italic',
    lineHeight: 18,
  },

  backButton: {

    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default GlossaryScreen;
