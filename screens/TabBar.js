import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import MarketScreen from '../screens/market/MarketScreen';
import FAQScreen from '../screens/FAQScreen';
import AssetsScreen from '../screens/asset/AssetsScreen'
import RiskHomeScreen from '../screens/risk/RiskHomeScreen';
import PortfolioDetailScreen from '../screens/asset/PortfolioDetailScreen';
import { useLocalization } from '../services/LocalizationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import MenuScreen from '../screens/MenuScreen';


const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const { t } = useLocalization();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          height: 80, 
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: insets.bottom,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#6B7280',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('Home'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name="home-sharp" 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Market"
        component={MarketScreen}
        options={{
          tabBarLabel: t('Market'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name="stats-chart" 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Risk"
        component={RiskHomeScreen}
        options={{
          tabBarLabel: t('Risk'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name="shield-outline" 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={AssetsScreen}
        options={{
          tabBarLabel: t('Varlıklar'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name="person" 
              size={22} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          tabBarLabel: t('Menu'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name="menu" size={22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
