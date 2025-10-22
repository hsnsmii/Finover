import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert, 
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useLocalization } from '../../services/LocalizationContext';
import { useAuth } from '../../services/auth/AuthContext';
import { ApiError } from '../../services/api/client';
import { captureWithContext } from '../../services/sentry';

const COLORS = {
  background: '#F7F8FA',
  card: '#FFFFFF',
  textPrimary: '#1D232E',
  textSecondary: '#8A94A6',
  primary: '#0052FF',
  lightPrimary: '#E6F0FF',
  border: '#EFF1F3',
  danger: '#D9534F',
};

const SettingsItem = ({ icon, label, rightComponent, isLast = false, onPress }) => (
  <TouchableOpacity onPress={onPress} disabled={!onPress} style={[styles.itemContainer, isLast && { borderBottomWidth: 0 }]}>
    <View style={styles.itemLeft}>
      <View style={[styles.iconContainer, { backgroundColor: COLORS.lightPrimary }]}>
        <Icon name={icon} size={20} color={COLORS.primary} />
      </View>
      <Text style={styles.itemLabel}>{label}</Text>
    </View>
    <View style={styles.itemRight}>
      {rightComponent}
    </View>
  </TouchableOpacity>
);

const AccountInfoScreen = ({ navigation }) => {

  const { language, setLanguage, t } = useLocalization();
  const { user, logout, refreshProfile } = useAuth();

  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      setUserId(user.id);
      setEmail(user.email);
    }
  }, [user, t]);

  useEffect(() => {
    const syncProfile = async () => {
      try {
        const profile = await refreshProfile();
        setUserId(profile.id);
        setEmail(profile.email);
      } catch (error) {
        if (!(error instanceof ApiError)) {
          captureWithContext(error, { screen: 'AccountInfo' });
        }
      }
    };

    syncProfile();
  }, [refreshProfile]);

  const LanguageSelector = () => (
    <View style={styles.langContainer}>
      <TouchableOpacity

        onPress={() => setLanguage('tr')}
        style={[styles.langButton, language === 'tr' && styles.langButtonActive]}
      >
        <Text style={[styles.langText, language === 'tr' && styles.langTextActive]}>TR</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setLanguage('en')}
        style={[styles.langButton, language === 'en' && styles.langButtonActive]}
      >
        <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
      </TouchableOpacity>
    </View>
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (error) {
      captureWithContext(error, { screen: 'AccountInfo', action: 'logout' });
      Alert.alert(t('Error'), t('An error occurred while logging out.'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            {}
            <Text style={styles.headerTitle}>{t('Account & Settings')}</Text>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('Account Information')}</Text>
            <View style={styles.card}>
                <SettingsItem 
                    icon="user" 
                    label={t('User ID')}
                    rightComponent={<Text style={styles.valueText}>{userId}</Text>}
                />
                <SettingsItem
                    icon="mail"
                    label={t('Email Address')}
                    rightComponent={<Text style={styles.valueText}>{email}</Text>}
                />
                 <SettingsItem 
                    icon="lock" 
                    label={t('Change Password')}
                    rightComponent={<Icon name="chevron-right" size={20} color={COLORS.textSecondary} />}
                    isLast={true}
                    onPress={() => navigation.navigate('ChangePassword')}
                />
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('App Settings')}</Text>
            <View style={styles.card}>
                <SettingsItem 
                    icon="bell" 
                    label={t('Notifications')}
                    rightComponent={
                        <Switch 
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: '#767577', true: COLORS.primary }}
                            thumbColor={'#f4f3f4'}
                        />
                    }
                />
                 <SettingsItem 
                    icon="globe" 
                    label={t('Language')}
                    rightComponent={<LanguageSelector />}
                    isLast={true}
                />
            </View>
        </View>

        <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
        >
            <Icon name="log-out" size={20} color={COLORS.danger} />
            <Text style={styles.logoutButtonText}>{t('Logout')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  itemRight: {
  },
  valueText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  langContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 2,
  },
  langButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  langButtonActive: {
    backgroundColor: COLORS.primary,
  },
  langText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  logoutButton: {
    margin: 24,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  }
});

export default AccountInfoScreen;
