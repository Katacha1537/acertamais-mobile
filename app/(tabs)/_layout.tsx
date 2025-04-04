import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons'; // Import Ionicons from expo/vector-icons
import * as Haptics from 'expo-haptics';
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function TabLayout() {

  const router = useRouter();

  const { user } = useAuth();

  useEffect(() => {
    console.log('useEffect disparado, user:', user);
    console.log('Valor atual de user é null?', user === null);
    if (!user) {
      console.log('Usuário deslogado, tentando redirecionar para /');
      router.replace('/'); // Usar replace para evitar histórico
      console.log('Redirecionamento chamado');
      return;
    }
    console.log('Usuário autenticado, chamando fetchData');
  }, [user, router]);

  // Componente personalizado para feedback tátil
  const HapticTab = ({ onPress, children, ...props }: any) => {
    const handlePressIn = (ev: any) => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (onPress) onPress(ev);
    };

    return (
      <TouchableOpacity
        {...props}
        onPressIn={handlePressIn}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  };

  // Componente de fundo da barra de navegação
  const TabBarBackground = () => (
    <View
      style={[
        styles.tabBarBackground,
        Platform.select({
          ios: { backgroundColor: 'transparent' },
          default: { backgroundColor: '#fff' },
        }),
      ]}
    />
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#003da5',
        headerShown: false,
        tabBarButton: (props) => <HapticTab {...props} />,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            borderTopWidth: 0,
          },
          default: {
            borderTopWidth: 1,
            borderTopColor: '#ddd',
          },
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="BusinessScreen"
        options={{
          title: 'Empresas',
          tabBarIcon: ({ color }) => (
            <Ionicons name="business-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="PendingRequestsScreen"
        options={{
          title: 'Solicitações',
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  tabBarBackground: {
    height: 60,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});