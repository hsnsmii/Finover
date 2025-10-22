import React, { useState } from 'react';
import {
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Text,
  View,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import styles from "../styles/faqscreenstyle";

const FAQScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBox, setSelectedBox] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const questions = [
    {
      id: '1',
      category: 'account',
      question: 'Finover’a nasıl kayıt olabilirim?',
      answer:
        'Finover uygulamasını indirip “Kayıt Ol” adımlarını takip ederek kolayca hesap oluşturabilirsiniz. Kayıt için e-posta adresi ve güçlü bir şifre yeterlidir.',
    },
    {
      id: '2',
      category: 'account',
      question: 'Hesabımı nasıl silebilirim?',
      answer:
        'Profil bölümündeki “Hesabı Sil” seçeneği üzerinden hesabınızı kapatma talebi gönderebilir veya destek ekibimizle iletişime geçebilirsiniz.',
    },

    // Takip Listesi
    {
      id: '3',
      category: 'watchlist',
      question: 'Takip listesi (Watchlist) nasıl oluşturulur?',
      answer:
        'Ana ekrandaki “Yeni Liste Oluştur” butonuna tıklayarak farklı portföyleriniz için takip listeleri oluşturabilirsiniz.',
    },
    {
      id: '4',
      category: 'watchlist',
      question: 'Bir hisseyi takip listeme nasıl eklerim?',
      answer:
        'Hisse detay sayfasında “Takip Listeme Ekle” butonuna tıklayarak dilediğiniz listeye ekleme yapabilirsiniz.',
    },

    // Risk Analizi
    {
      id: '5',
      category: 'risk',
      question: 'Portföy risk analizi nasıl çalışıyor?',
      answer:
        'Finover, seçtiğiniz hisselerin geçmiş verilerini, teknik indikatörleri ve AI destekli modelleri kullanarak portföyünüzün risk seviyesini (Düşük/Orta/Yüksek) otomatik olarak analiz eder.',
    },
    {
      id: '6',
      category: 'risk',
      question: 'Risk analizi hangi kriterlere göre yapılıyor?',
      answer:
        'Risk skoru; fiyat volatilitesi, beta değeri, teknik göstergeler (RSI, SMA vb.) ve portföy çeşitliliği gibi faktörlere göre hesaplanır.',
    },

    // Yapay Zeka
    {
      id: '7',
      category: 'ai',
      question: 'AI destekli öneriler nedir ve nasıl çalışır?',
      answer:
        'AI destekli öneriler, portföyünüzün risk-getiri dengesine göre uygun hisse dağılımı ve alternatif yatırım stratejileri sunar. Bu öneriler, gerçek zamanlı veriler ve makine öğrenmesi modelleri ile oluşturulur.',
    },

    // Borsa Verisi
    {
      id: '8',
      category: 'stockdata',
      question: 'Finover’da gerçek zamanlı borsa verileri var mı?',
      answer:
        'Evet, BIST (Borsa İstanbul) ve seçili hisse senetlerine ait fiyatlar ve haberler gerçek zamanlı olarak güncellenmektedir.',
    },
    {
      id: '9',
      category: 'stockdata',
      question: 'Geçmiş hisse verilerine nasıl erişebilirim?',
      answer:
        'Hisse detay sayfasında, grafik ve geçmiş fiyat verilerini gün/gün veya belirli zaman aralıklarında görüntüleyebilirsiniz.',
    },

    // Grafik ve Rapor
    {
      id: '10',
      category: 'graph',
      question: 'Portföyümdeki risk ve dağılımı nasıl görebilirim?',
      answer:
        'Portföyünüzdeki risk trendini ve hisse dağılımını grafikler (ör. pasta grafiği ve çizgi grafik) ile takip edebilirsiniz.',
    },
    {
      id: '11',
      category: 'pdf',
      question: 'Portföy raporunu PDF olarak indirebilir miyim?',
      answer:
        'Evet, portföy analizi veya risk değerlendirme ekranında “PDF’ye Aktar” seçeneği ile raporunuzu indirebilirsiniz.',
    },

    // Bildirim
    {
      id: '12',
      category: 'notification',
      question: 'Fiyat uyarısı ve bildirim özelliği var mı?',
      answer:
        'Yakında eklenecek! Belirlediğiniz fiyat seviyelerine ulaşıldığında anlık bildirim alabileceksiniz.',
    },

    // Ücretler
    {
      id: '13',
      category: 'fees',
      question: 'Finover’ı kullanmak ücretli mi?',
      answer:
        'Finover’ın temel fonksiyonları tamamen ücretsizdir. İleride ek Pro özellikler için abonelik seçenekleri sunulabilir.',
    },

    // Güvenlik
    {
      id: '14',
      category: 'security',
      question: 'Veri güvenliği için hangi önlemler alınıyor?',
      answer:
        'Kullanıcı verileri şifreli olarak saklanır. Tüm finansal işlemler ve kişisel bilgiler yüksek güvenlik protokolleri ile korunmaktadır.',
    },

    // Destek
    {
      id: '15',
      category: 'support',
      question: 'Destek ekibine nasıl ulaşabilirim?',
      answer:
        'Ayarlar veya Yardım bölümünden bize mesaj gönderebilir, ayrıca support@finover.com adresinden destek talebi oluşturabilirsiniz.',
    },

    // Teknik Sorular
    {
      id: '16',
      category: 'technical',
      question: 'Finover hangi cihazlarda çalışır?',
      answer:
        'Finover, hem iOS hem de Android işletim sistemine sahip akıllı telefonlarda çalışır.',
    },
    {
      id: '17',
      category: 'technical',
      question: 'API üzerinden veri çekiyor musunuz?',
      answer:
        'Evet, borsa verileri ve haberler lisanslı üçüncü parti API servisleri ile güvenli şekilde çekilir ve gösterilir.',
    },

    // Hukuki Sorular
    {
      id: '18',
      category: 'legal',
      question: 'Yatırım tavsiyesi veriyor musunuz?',
      answer:
        'Finover, yatırım danışmanlığı veya bireysel tavsiye sunmaz. Sunulan analizler ve öneriler yalnızca bilgilendirme amaçlıdır.',
    },
    {
      id: '19',
      category: 'legal',
      question: 'Hukuki olarak sorumluluk kimde?',
      answer:
        'Finover’daki analizler öneri niteliğindedir ve yatırım kararlarınızdan kullanıcı olarak siz sorumlusunuz. Uygulamayı kullanmadan önce Kullanıcı Sözleşmesi’ni dikkatlice okuyunuz.',
    },

    // Yatırım & Tavsiye
    {
      id: '20',
      category: 'advice',
      question: 'Finover’da yatırım yapabilir miyim?',
      answer:
        'Hayır, Finover yalnızca analiz ve portföy yönetim aracı olarak hizmet verir. Uygulama üzerinden doğrudan alım-satım yapılamaz.',
    },
    {
      id: '21',
      category: 'advice',
      question: 'Portföyüme yeni bir hisse eklersem riskim nasıl değişir?',
      answer:
        'Portföy analizi ekranındaki “Simülasyon” özelliği ile eklemek istediğiniz hisseyi seçip olası risk ve dağılım değişimini önceden görebilirsiniz.',
    },
    {
      id: '22',
      category: 'advice',
      question: 'Yatırım yaparken nelere dikkat etmeliyim?',
      answer:
        'Finover’ın sunduğu risk skorları ve çeşitlilik analizi sadece yol göstericidir. Kendi finansal hedefleriniz ve risk toleransınızı da göz önünde bulundurmalısınız.',
    },
  ];

  const categories = [
    { id: 'all', title: 'Tümü' },
    { id: 'account', title: 'Hesap' },
    { id: 'watchlist', title: 'Takip Listesi' },
    { id: 'risk', title: 'Risk Analizi' },
    { id: 'ai', title: 'Yapay Zeka' },
    { id: 'stockdata', title: 'Borsa Verisi' },
    { id: 'graph', title: 'Grafik' },
    { id: 'pdf', title: 'Rapor' },
    { id: 'notification', title: 'Bildirim' },
    { id: 'fees', title: 'Ücretler' },
    { id: 'security', title: 'Güvenlik' },
    { id: 'technical', title: 'Teknik' },
    { id: 'legal', title: 'Hukuki' },
    { id: 'advice', title: 'Yatırım-Tavsiye' },
    { id: 'support', title: 'Destek' },
  ];

  const handleSearch = (query) => setSearchQuery(query);

  const handleBoxClick = (id) => setSelectedBox(prev => prev === id ? null : id);

  const getFilteredQuestions = () => {
    let filtered = questions;
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (activeCategory !== 'all') {
      filtered = filtered.filter(q => q.category === activeCategory);
    }
    return filtered;
  };

  const handleCategoryChange = (categoryId) => {
    setIsLoading(true);
    setActiveCategory(categoryId);
    setTimeout(() => setIsLoading(false), 300);
  };

  const filteredQuestions = getFilteredQuestions();

return (
  <SafeAreaView style={styles.container}>
    <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

    <TouchableOpacity
      style={styles.backButton}
      onPress={() => navigation.goBack()}
      activeOpacity={0.8}
    >
      <FontAwesome name="arrow-left" size={20} color="#1A237E" /> {/* Kurumsal Mavi */}
    </TouchableOpacity>

    <View style={styles.titleWrapper}>
      <Text style={styles.title}>Sık Sorulan Sorular</Text>
      <Text style={styles.subtitle}>
        Yardım merkezimizde sık sorulan sorular
      </Text>
    </View>

    <View style={styles.searchContainer}>
      <FontAwesome name="search" size={22} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Soru ara..."
        placeholderTextColor="#6B7280" // Taş Grisi
        value={searchQuery}
        onChangeText={handleSearch}
      />
    </View>

    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingRight: 20 }}
      style={{ marginBottom: 20, flexGrow: 0 }}
    >
      {categories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.categoryChip,
            activeCategory === category.id && styles.categoryChipActive,
          ]}
          onPress={() => handleCategoryChange(category.id)}
        >
          <Text
            style={[
              styles.categoryText,
              activeCategory === category.id && styles.categoryTextActive,
            ]}
          >
            {category.title}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>

    {isLoading ? (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A237E" /> {/* Kurumsal Mavi */}
      </View>
    ) : filteredQuestions.length > 0 ? (
      <ScrollView
        style={styles.questionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredQuestions.map((item) => (
          <View key={item.id} style={styles.questionContainer}>
            <TouchableOpacity
              style={styles.questionHeader}
              onPress={() => handleBoxClick(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.questionText}>{item.question}</Text>
              <View style={styles.questionIcon}>
                <FontAwesome
                  name={
                    selectedBox === item.id ? 'chevron-up' : 'chevron-down'
                  }
                  size={14}
                  color="#1A237E" // Kurumsal Mavi
                />
              </View>
            </TouchableOpacity>
            {selectedBox === item.id && (
              <View style={styles.answerContainer}>
                <Text style={styles.answerText}>{item.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    ) : (
      <View style={styles.noResultsContainer}>
        <FontAwesome name="search" size={50} style={styles.noResultsIcon} />
        <Text style={styles.noResultsText}>
          Aradığınız kriterlere uygun soru bulunamadı.
        </Text>
      </View>
    )}
  </SafeAreaView>
);

};

export default FAQScreen;
