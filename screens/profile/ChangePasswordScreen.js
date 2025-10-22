import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useLocalization } from '../../services/LocalizationContext';
import { changePassword } from '../../services/api/auth';
import { ApiError } from '../../services/api/client';
import { captureWithContext } from '../../services/sentry';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const checkPasswordStrength = (password, t) => {
  const validations = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[\W_]/.test(password),
  };

  const strengthScore = Object.values(validations).filter(Boolean).length;
  let strength = { label: t('Very Weak'), color: '#ef4444', score: 1 };

  if (strengthScore >= 5) {
    strength = { label: t('Very Strong'), color: '#22c55e', score: 5 };
  } else if (strengthScore === 4) {
    strength = { label: t('Strong'), color: '#84cc16', score: 4 };
  } else if (strengthScore === 3) {
    strength = { label: t('Medium'), color: '#f59e0b', score: 3 };
  } else if (strengthScore === 2) {
    strength = { label: t('Weak'), color: '#f97316', score: 2 };
  }

  return { validations, strength };
};

const PasswordRequirement = ({ met, text }) => (
  <View style={styles.requirementRow}>
    <Icon 
      name={met ? 'check-circle' : 'circle'} 
      color={met ? '#22c55e' : '#9ca3af'} 
      size={16} 
    />
    <Text style={[styles.requirementText, met && styles.requirementMet]}>{text}</Text>
  </View>
);

const ChangePasswordScreen = () => {
  const { t } = useLocalization(); 

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [isCurrentPasswordVisible, setCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setNewPasswordVisible] = useState(false);

  const [passwordAnalysis, setPasswordAnalysis] = useState(checkPasswordStrength('', t));

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPasswordAnalysis(checkPasswordStrength(newPassword, t));
  }, [newPassword, t]);

  const handleChange = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert(t('Error'), t('Please fill in all fields.'));
      return;
    }

    if (passwordAnalysis.strength.score < 4) {
      Alert.alert(t('Weak Password'), t('Your new password is not secure enough.'));
      return;
    }

    setLoading(true);

    try {
      await changePassword({ currentPassword, newPassword });
      Alert.alert(t('Success'), t('Password updated successfully.'));
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      if (err instanceof ApiError) {
        const message = err?.data?.message || t('Could not update password.');
        Alert.alert(t('Error'), message);
      } else {
        captureWithContext(err, { screen: 'ChangePassword' });
        Alert.alert(t('Error'), t('Could not update password.'));
      }
    } finally {
        setLoading(false);
    }
  };

  const { validations, strength } = passwordAnalysis;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{t('Change Password')}</Text>
        <Text style={styles.subtitle}>
          {t('Your new password must be different from your old one.')}
        </Text>

        {}
        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color="#9ca3af" style={styles.inputIcon} />
          <TextInput
            placeholder={t('Current Password')}
            placeholderTextColor="#9ca3af"
            secureTextEntry={!isCurrentPasswordVisible}
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setCurrentPasswordVisible(!isCurrentPasswordVisible)}>
            <Icon name={isCurrentPasswordVisible ? 'eye-off' : 'eye'} size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {}
        <View style={styles.inputContainer}>
          <Icon name="key" size={20} color="#9ca3af" style={styles.inputIcon} />
          <TextInput
            placeholder={t('New Password')}
            placeholderTextColor="#9ca3af"
            secureTextEntry={!isNewPasswordVisible}
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            editable={!loading}
          />
          <TouchableOpacity onPress={() => setNewPasswordVisible(!isNewPasswordVisible)}>
            <Icon name={isNewPasswordVisible ? 'eye-off' : 'eye'} size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {}
        {newPassword.length > 0 && (
          <View style={styles.strengthContainer}>
            <View style={styles.strengthBarContainer}>
                <View style={[styles.strengthBar, { width: `${strength.score * 20}%`, backgroundColor: strength.color }]} />
            </View>
            <Text style={[styles.strengthText, { color: strength.color }]}>{strength.label}</Text>

            <View style={styles.requirementsContainer}>
                <PasswordRequirement met={validations.length} text={t('At least 8 characters')} />
                <PasswordRequirement met={validations.hasUpper} text={t('One uppercase letter (A-Z)')} />
                <PasswordRequirement met={validations.hasLower} text={t('One lowercase letter (a-z)')} />
                <PasswordRequirement met={validations.hasNumber} text={t('One number (0-9)')} />
                <PasswordRequirement met={validations.hasSymbol} text={t('One symbol (!@#...)')} />
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.button, (loading || passwordAnalysis.strength.score < 4) && styles.buttonDisabled]} 
          onPress={handleChange}
          disabled={loading || passwordAnalysis.strength.score < 4}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('Update Password')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', 
    justifyContent: 'center',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1F2937', 
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: '#6B7280', 
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', 
    borderWidth: 1,
    borderColor: '#E5E7EB', 
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 16,
    color: '#1F2937', 
  },
  button: {
    backgroundColor: '#10B981', 
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonDisabled: {
    backgroundColor: '#E5E7EB', 
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF', 
    fontWeight: 'bold',
    fontSize: 16,
  },
  strengthContainer: {
    marginTop: -10,
    marginBottom: 20,
  },
  strengthBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB', 
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  strengthBar: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#10B981', 
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 15,
    color: '#6B7280', 
  },
  requirementsContainer: {
    marginTop: 5,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requirementText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#6B7280', 
  },
  requirementMet: {
    color: '#1F2937', 

  },
});
export default ChangePasswordScreen;
