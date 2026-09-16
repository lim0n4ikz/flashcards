import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import type {
  RootStackParamList,
  RootTabParamList,
} from './types';

import { useApp } from '../context/AppContext';

import HomeScreen from '../screens/HomeScreen';
import LearnScreen from '../screens/LearnScreen';
import FlashcardsScreen from '../screens/FlashcardsScreen';
import WordsScreen from '../screens/WordsScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfilesScreen from '../screens/ProfilesScreen';
import ProfileFormScreen from '../screens/ProfileFormScreen';
import WordFormScreen from '../screens/WordFormScreen';

const Tab = createBottomTabNavigator<RootTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  const { theme } = useApp();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        // Цвет выбранной вкладки
        tabBarActiveTintColor: theme.primary,

        // Цвет невыбранных вкладок
        tabBarInactiveTintColor: theme.secondaryText,

        // Нижняя панель
        tabBarStyle: {
          backgroundColor: theme.sheet,
          borderTopColor: theme.border,
        },

        // Текст вкладок
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },

        // Иконки
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap =
            'home-outline';

          if (route.name === 'Home') {
            iconName = 'home-outline';
          } else if (route.name === 'Learn') {
            iconName = 'school-outline';
          } else if (route.name === 'Flashcards') {
            iconName = 'albums-outline';
          } else if (route.name === 'Words') {
            iconName = 'book-outline';
          } else if (route.name === 'Stats') {
            iconName = 'stats-chart-outline';
          } else if (route.name === 'Settings') {
            iconName = 'settings-outline';
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Главная',
        }}
      />

      <Tab.Screen
        name="Learn"
        component={LearnScreen}
        options={{
          title: 'Обучение',
        }}
      />

      <Tab.Screen
        name="Flashcards"
        component={FlashcardsScreen}
        options={{
          title: 'Карточки',
        }}
      />

      <Tab.Screen
        name="Words"
        component={WordsScreen}
        options={{
          title: 'Слова',
        }}
      />

      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          title: 'Статистика',
        }}
      />

      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Настройки',
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { theme } = useApp();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.card,
          },

          headerTintColor: theme.text,

          headerTitleStyle: {
            fontWeight: '700',
          },

          contentStyle: {
            backgroundColor: theme.background,
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="Profiles"
          component={ProfilesScreen}
          options={{
            title: 'Профили',
          }}
        />

        <Stack.Screen
          name="ProfileForm"
          component={ProfileFormScreen}
          options={{
            title: 'Новый профиль',
          }}
        />

        <Stack.Screen
          name="Flashcards"
          component={FlashcardsScreen}
          options={{
            title: 'Карточки',
          }}
        />

        <Stack.Screen
          name="WordForm"
          component={WordFormScreen}
          options={{
            title: 'Добавить слово',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

