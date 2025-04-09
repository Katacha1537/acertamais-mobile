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

interface Service {
  id: string;
  nome_servico: string;
  credenciadoNome: string;
  createdAt: { seconds: number };
}

interface UserData {
  nome?: string;
  empresaId: string;
  [key: string]: any;
}

export default function HomeScreen() {
  const { user } = useAuth(); // Renomeei para evitar confusão com variáveis locais
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
    console.log('useEffect disparado, user:', user);
    if (!user) {
      console.log('Usuário deslogado, redirecionando para /');
      // Adicionar um pequeno atraso para evitar conflitos de renderização
      setTimeout(() => {
        router.push({
          pathname: '/ResetToRoot'
        });
      }, 0);
      return;
    }
    console.log('Usuário autenticado, chamando fetchData');
    fetchData();
  }, [user, router]);

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

      router.push({
        pathname: '/ResetToRoot'
      });
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
        <ActivityIndicator size="large" color="#003087" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (!userData && user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Erro ao carregar dados</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleLogout} disabled={logoutLoading} style={styles.logoutButton}>
          {logoutLoading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.logoutText}>SAIR</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bem-vindo, {userData?.nome || 'Usuário'}!</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.companyText}>Trabalha em: {companyName || 'Empresa não disponível'}</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#003087']} tintColor="#003087" />
        }
      >
        <View style={styles.dashboardContainer}>
          <View style={styles.dashboardCard}>
            <Text style={styles.dashboardLabel}>Serviços Contratados:</Text>
            <Text style={styles.dashboardInfo}>{servicosContratados}</Text>
          </View>
          <Text style={styles.sectionTitle}>Histórico de Serviços Feitos</Text>
          {historicoServicos.length > 0 ? (
            historicoServicos.map((servico) => (
              <View key={servico.id} style={styles.serviceItem}>
                <View>
                  <Text style={styles.serviceName}>{servico.nome_servico || 'Sem nome'}</Text>
                  <Text style={styles.companyName}>{servico.credenciadoNome || 'Desconhecida'}</Text>
                </View>
                <Text style={styles.serviceDate}>
                  {servico.createdAt
                    ? new Date(servico.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                    : 'Sem data'}
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
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    fontSize: 18,
    color: '#003087',
    marginTop: 10,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#003087',
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  logoutButton: {
    alignItems: 'center',
    marginBottom: 50,
    marginTop: 20,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'red',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'left',
  },
  userInfo: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  companyText: {
    fontSize: 16,
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
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  dashboardCard: {
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#003087',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#003087',
    textAlign: 'left',
    marginBottom: 15,
  },
  serviceItem: {
    backgroundColor: '#F5F7FA',
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
    color: '#003087',
  },
  companyName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 2,
  },
  serviceDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  noServiceText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginVertical: 10,
  },
});