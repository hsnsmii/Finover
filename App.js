import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import { LocalizationProvider, useLocalization } from './services/LocalizationContext';
import { AuthProvider, useAuth } from './services/auth/AuthContext';
import { initSentry, Sentry } from './services/sentry';
import ErrorFallback from './components/ErrorFallback';

import LoginScreen from './screens/auth/LoginScreen';
import RegisterScreen from './screens/auth/RegisterScreen';
import StockDetailScreen from './screens/market/StockDetailScreen';
import WatchlistDetailScreen from './screens/home/WatchlistDetailScreen';
import PortfolioDetailScreen from './screens/asset/PortfolioDetailScreen';
import AddPositionScreen from './screens/asset/AddPositionScreen';
import AccountInfoScreen from './screens/profile/AccountInfoScreen';
import ChangePasswordScreen from './screens/profile/ChangePasswordScreen';
import PortfolioRiskScreen from './screens/PortfolioRiskScreen';
import GlossaryScreen from './screens/GlossaryScreen';
import FAQScreen from './screens/FAQScreen';
import MenuScreen from './screens/MenuScreen';
import AboutScreen from './screens/AboutScreen';

import MainTabs from './screens/TabBar';

initSentry();

const RootStack = createStackNavigator();
const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

const SplashScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
    <ActivityIndicator size="large" color="#0B0B45" />
  </View>
);

const AuthStackScreen = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const AppStackScreen = () => {
  const { t } = useLocalization();

  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="MainTabs" component={MainTabs} />
      <AppStack.Screen
        name="StockDetail"
        component={StockDetailScreen}
        options={{ title: 'Hisse Detayı', headerShown: true }}
      />
      <AppStack.Screen
        name="WatchlistDetail"
        component={WatchlistDetailScreen}
        options={{ title: '', headerShown: true }}
      />
      <AppStack.Screen name="PortfolioDetail" component={PortfolioDetailScreen} />
      <AppStack.Screen name="AddPosition" component={AddPositionScreen} />
      <AppStack.Screen
        name="AccountInfo"
        component={AccountInfoScreen}
        options={{ title: t('Account Information'), headerShown: true }}
      />
      <AppStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: t('Change Password'), headerShown: true }}
      />
      <AppStack.Screen name="PortfolioRisk" component={PortfolioRiskScreen} />
      <AppStack.Screen
        name="Glossary"
        component={GlossaryScreen}
        options={{ title: 'Yatırımcı Sözlüğü', headerBackVisible: false, headerShown: false }}
      />
      <AppStack.Screen name="Menu" component={MenuScreen} />
      <AppStack.Screen name="About" component={AboutScreen} options={{ title: t('About'), headerShown: false }} />
      <AppStack.Screen
        name="FAQ"
        component={FAQScreen}
        options={{ title: ' ', headerLeft: () => null, headerShown: false }}
      />
    </AppStack.Navigator>
  );
};

const RootNavigator = () => {
  const { bootstrapping, user } = useAuth();
  if (bootstrapping) return <SplashScreen />;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <RootStack.Screen name="App" component={AppStackScreen} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStackScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const AppContent = () => (
  <LocalizationProvider>
    <AuthProvider>
      <Sentry.ErrorBoundary fallback={({ error, resetError }) => <ErrorFallback error={error} resetError={resetError} />}>
        <RootNavigator />
      </Sentry.ErrorBoundary>
    </AuthProvider>
  </LocalizationProvider>
);

const App = () => <AppContent />;

export default Sentry.wrap(App);
