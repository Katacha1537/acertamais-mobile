import { Ionicons } from '@expo/vector-icons'; // Import Ionicons from expo/vector-icons
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Adicionei updateDoc
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../service/firebase';

interface UserData {
  nome?: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  dataNascimento?: string;
  pessoasNaCasa?: number;
  status?: string; // Adicionado para suportar o campo status
}

export default function ProfileScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [menuVisible, setMenuVisible] = useState<boolean>(false); // Estado para controlar o menu

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'funcionarios', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          setUserData(userDoc.data() as UserData);
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Função para desativar a conta
  const handleDisableAccount = async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'funcionarios', user.uid);
      await updateDoc(userDocRef, { status: 'disabled' });
      Alert.alert('Sucesso', 'Sua conta foi desativada.');
      setUserData((prev) => ({ ...prev, status: 'disabled' })); // Atualiza localmente
    } catch (error) {
      console.error('Erro ao desativar conta:', error);
      Alert.alert('Erro', 'Não foi possível desativar a conta. Tente novamente.');
    }
  };

  // Função para confirmar a desativação da conta
  const confirmDisableAccount = () => {
    Alert.alert(
      'Desativar Conta',
      'Tem certeza que deseja apagar sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: handleDisableAccount,
        },
      ]
    );
    setMenuVisible(false); // Fecha o menu após clicar
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.noUserText}>Faça login para continuar</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.userName}>{userData?.nome || 'Usuário'}</Text>
        <Text style={styles.userCpf}>{userData?.cpf || 'CPF não disponível'}</Text>
        {/* Botão Hamburguer */}
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Ionicons name="menu-outline" size={30} color="white" />
        </TouchableOpacity>
        {/* Menu Dropdown */}
        {menuVisible && (
          <View style={styles.menuDropdown}>
            <TouchableOpacity style={styles.menuItem} onPress={confirmDisableAccount}>
              <Ionicons name="trash-outline" size={20} color="#FF0000" />
              <Text style={styles.menuText}>Apagar Conta</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Informações */}
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={20} color="#003DA5" style={styles.icon} />
          <View>
            <Text style={styles.label}>Data de Nascimento:</Text>
            <Text style={styles.text}>{userData?.dataNascimento || 'Não disponível'}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#003DA5" style={styles.icon} />
          <View>
            <Text style={styles.label}>E-mail:</Text>
            <Text style={styles.text}>{userData?.email || 'Não disponível'}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color="#003DA5" style={styles.icon} />
          <View>
            <Text style={styles.label}>Telefone:</Text>
            <Text style={styles.text}>{userData?.telefone || 'Não disponível'}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={20} color="#003DA5" style={styles.icon} />
          <View>
            <Text style={styles.label}>Pessoas na Casa:</Text>
            <Text style={styles.text}>{userData?.pessoasNaCasa || 'Não disponível'}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={20} color="#003DA5" style={styles.icon} />
          <View>
            <Text style={styles.label}>Endereço:</Text>
            <Text style={styles.text}>{userData?.endereco || 'Não disponível'}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#003DA5',
    padding: 20,
    paddingTop: 80,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative', // Para posicionar o botão hamburguer
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
  },
  userCpf: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
    textAlign: 'left',
  },
  menuButton: {
    position: 'absolute',
    top: 80, // Ajuste conforme necessário para alinhar com o cabeçalho
    right: 20,
  },
  menuDropdown: {
    position: 'absolute',
    top: 120, // Ajuste para aparecer abaixo do botão
    right: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  menuText: {
    fontSize: 16,
    color: '#FF0000',
    marginLeft: 10,
  },
  infoContainer: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 5,
  },
  icon: {
    marginRight: 10,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginTop: 2,
  },
  noUserText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});