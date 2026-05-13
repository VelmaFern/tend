import 'dotenv/config';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import CircleScreen from './src/screens/CircleScreen';
import KeptScreen from './src/screens/KeptScreen';
import TasksScreen from './src/screens/TasksScreen';
import YouScreen from './src/screens/YouScreen';

import { initializeNotifications } from './src/services/notificationService';
import { COLORS } from './src/theme/colors';
import { loadInitialData } from './src/services/storageService';

const Tab = createBottomTabNavigator();

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [theme, setTheme] = useState('sunday');

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load theme
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) setTheme(savedTheme);

        // Initialize data
        await loadInitialData();

        // Initialize notifications
        await initializeNotifications();

        setIsReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setIsReady(true); // Still load even if init fails
      }
    };

    initializeApp();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EDE4D2' }}>
        <ActivityIndicator size="large" color="#C4785A" />
      </View>
    );
  }

  const themeColors = COLORS[theme];

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: themeColors.background,
            borderTopColor: themeColors.border,
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 60,
          },
          tabBarActiveTintColor: themeColors.accent,
          tabBarInactiveTintColor: '#999',
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 12,
            marginTop: 4,
            fontFamily: 'dm-sans',
          },
        }}
      >
        <Tab.Screen
          name="Circle"
          component={CircleScreen}
          options={{
            tabBarLabel: 'Circle',
          }}
        />
        <Tab.Screen
          name="Kept"
          component={KeptScreen}
          options={{
            tabBarLabel: 'Kept',
          }}
        />
        <Tab.Screen
          name="Tasks"
          component={TasksScreen}
          options={{
            tabBarLabel: 'Tasks',
          }}
        />
        <Tab.Screen
          name="You"
          component={YouScreen}
          options={{
            tabBarLabel: 'You',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
