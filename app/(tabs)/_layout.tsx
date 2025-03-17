import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { Bell, BusFront, Home, User } from 'lucide-react-native';

export default function TabLayout() {
  // Defina a cor ativa diretamente como light (para o modo claro)
  const activeTintColor = Colors.light.tint;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#003da5', // Definir a cor ativa para o light mode
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => (
            <Home size={28} color={color} /> // Ícone Lucide
          ),
        }}
      />
      <Tabs.Screen
        name="BusinessScreen"
        options={{
          title: 'Empresas',
          tabBarIcon: ({ color }) => (
            <BusFront size={28} color={color} /> // Ícone Lucide
          ),
        }}
      />
      <Tabs.Screen
        name="PendingRequestsScreen"
        options={{
          title: 'Solicitações',
          tabBarIcon: ({ color }) => (
            <Bell size={28} color={color} /> // Ícone Lucide
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <User size={28} color={color} /> // Ícone Lucide
          ),
        }}
      />
    </Tabs>
  );
}
