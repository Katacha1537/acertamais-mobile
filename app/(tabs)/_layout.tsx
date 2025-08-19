import { useAuth } from '@/context/AuthContext';
import { useIsOk } from '@/context/IsOkContext';
import { db } from '@/service/firebase';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Tabs, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface UserData {
  nome?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  dataNascimento?: string;
  pessoasNaCasa?: number;
  isReq: boolean;
  status?: string;
}

export default function TabLayout() {
  const router = useRouter();
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const { isOk } = useIsOk();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      router.push('/ResetToRoot');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Buscar dados do usuário no Firestore
        const userDocRef = doc(db, 'funcionarios', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('Firestore data:', data);
          setUserData(data as UserData);
        } else {
          console.log('Documento do usuário não encontrado');
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  // Debug isOk changes
  useEffect(() => {
    console.log('userData:', userData);
    console.log('isOk:', isOk);
  }, [userData, isOk]);

  const HapticTab = ({ onPress, children, ...props }: any) => {
    const handlePressIn = () => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (Platform.OS === 'android') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onPress?.();
    };

    return (
      <TouchableOpacity
        {...props}
        onPress={handlePressIn}
        style={styles.tabButton}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  };

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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#003da5" />
      </View>
    );
  }

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
        name="CartScreen"
        options={{
          title: 'Carrinho',
          tabBarIcon: ({ color }) => (
            <Ionicons name="cart-outline" size={24} color={color} />
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
          href: isOk === false ? undefined : null, // Hide tab when isOk is true
          tabBarLabel: isOk === false ? 'Perfil' : '', // Ensure no label when hidden
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