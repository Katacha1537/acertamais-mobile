import { signOut } from '@firebase/auth';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { auth, db } from '../../service/firebase';

// Tipagem para os dados do serviço
interface Service {
  id: string;
  nome_servico: string;
  credenciadoNome: string;
  createdAt: { seconds: number };
}

// Tipagem para os dados do usuário
interface UserData {
  nome?: string;
  empresaId: string;
  [key: string]: any;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [servicosContratados, setServicosContratados] = useState<number>(0);
  const [historicoServicos, setHistoricoServicos] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [logoutLoading, setLogoutLoading] = useState<boolean>(false);

  const router = useRouter();

  const fetchData = async () => {
    try {
      setRefreshing(true);
      if (!user) throw new Error('Usuário não autenticado');

      const userDocRef = doc(db, 'funcionarios', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) throw new Error('Usuário não encontrado');
      const data = userDoc.data() as UserData;
      setUserData(data);

      const companyDocRef = doc(db, 'empresas', data.empresaId);
      const companyDoc = await getDoc(companyDocRef);
      if (companyDoc.exists()) setCompanyName(companyDoc.data().nomeFantasia);

      const solicitacoesRef = collection(db, 'solicitacoes');
      const q = query(solicitacoesRef, where('clienteId', '==', user.uid), where('status', '==', 'confirmada'));
      const querySnapshot = await getDocs(q);
      setServicosContratados(querySnapshot.size);

      const servicosList = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const servicoData = doc.data();
          const credenciadoNome = await getNameCredenciado(servicoData.donoId);

          return {
            id: doc.id,
            nome_servico: servicoData.nome_servico || 'Serviço sem nome',
            credenciadoNome,
            createdAt: servicoData.createdAt || { seconds: 0 },
          };
        })
      );
      setHistoricoServicos(servicosList);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro no fetchData:', error.message);
      } else {
        console.error('Erro desconhecido:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      console.log("usuario deslogado")
      router.push({
        pathname: '/'
      })
      setLoading(false);
      return;
    }
    fetchData();
  }, [user]);

  const onRefresh = () => {
    if (!user) return;
    fetchData();
  };

  const getNameCredenciado = async (donoId: string): Promise<string> => {
    try {
      const credenciadoRef = doc(db, 'credenciados', donoId);
      const credenciadoSnap = await getDoc(credenciadoRef);
      if (credenciadoSnap.exists()) {
        return credenciadoSnap.data().nomeFantasia || 'Empresa desconhecida';
      } else {
        console.error('Credenciado não encontrado.');
        return 'Empresa desconhecida';
      }
    } catch (error) {
      console.error('Erro ao buscar credenciado:', error);
      return 'Erro ao buscar empresa';
    }
  };

  const handleLogout = async () => {
    if (logoutLoading) return;
    setLogoutLoading(true);
    try {
      console.log('Iniciando logout...');
      await signOut(auth);
      console.log('Logout concluído com sucesso');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao sair da conta. Tente novamente.');
    } finally {
      setLogoutLoading(false);
      console.log('Finalizando processo de logout');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003DA5" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Erro ao carregar dados</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} disabled={logoutLoading}>
          {logoutLoading ? (
            <ActivityIndicator size="small" color="#FFF" style={styles.logoutButton} />
          ) : (
            <Text style={styles.logoutText}>SAIR</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Bem-vindo, {userData?.nome || 'Usuário'}!
        </Text>

      </View>

      {/* Informações da Empresa */}
      <View style={styles.userInfo}>
        <Text style={styles.companyText}>
          Trabalha em: {companyName || 'Empresa não disponível'}
        </Text>
      </View>

      {/* Dashboard e Histórico */}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#003DA5']}
            tintColor={'#003DA5'}
          />
        }
      >
        <View style={styles.dashboardContainer}>
          {/* Card de Serviços Contratados */}
          <View style={styles.dashboardCard}>
            <Text style={styles.dashboardLabel}>Serviços Contratados:</Text>
            <Text style={styles.dashboardInfo}>{servicosContratados}</Text>
          </View>

          {/* Histórico de Serviços */}
          <Text style={styles.sectionTitle}>Histórico de Serviços Feitos</Text>
          {historicoServicos.length > 0 ? (
            historicoServicos.map((servico) => (
              <View key={servico.id} style={styles.serviceItem}>
                <View>
                  <Text style={styles.serviceName}>
                    {servico.nome_servico || 'Serviço sem nome'}
                  </Text>
                  <Text style={styles.companyName}>
                    {servico.credenciadoNome || 'Serviço sem nome'}
                  </Text>
                </View>
                <Text style={styles.serviceDate}>
                  {servico.createdAt
                    ? new Date(servico.createdAt.seconds * 1000).toLocaleDateString()
                    : ''}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noServiceText}>Nenhum serviço concluído.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  companyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F7FC',
  },
  loadingText: {
    fontSize: 18,
    color: '#003DA5',
    marginTop: 10,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  header: {
    backgroundColor: '#003DA5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 50,
  },
  logoutButton: {
    marginTop: 50,
    marginBottom: 10,
  },
  logoutText: {
    marginTop: 50,
    marginBottom: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#FF0000', // Vermelho
  },
  userInfo: {
    alignItems: 'center',
    marginVertical: 20,
  },
  companyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dashboardContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  dashboardCard: {
    backgroundColor: '#F4F7FC',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  dashboardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  dashboardInfo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#003DA5',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#003DA5',
    marginVertical: 15,
    textAlign: 'center',
  },
  serviceItem: {
    backgroundColor: '#F4F7FC',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003DA5',
  },
  serviceDate: {
    fontSize: 14,
    color: '#666',
  },
  noServiceText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginVertical: 10,
  },
});