import { Ionicons } from '@expo/vector-icons';
import { signOut } from '@firebase/auth';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  serviceId: string;
  nome_servico: string;
  preco: number;
  quantity: number;
  total: number;
  credenciado_id: string;
  empresa_nome: string;
}

interface Solicitation {
  id: string;
  services: Service[];
  total: number;
  createdAt: { seconds: number };
}

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
  const [historicoSolicitacoes, setHistoricoSolicitacoes] = useState<Solicitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [logoutLoading, setLogoutLoading] = useState<boolean>(false);
  const [expandedSolicitationId, setExpandedSolicitationId] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState<boolean>(false); // Estado para controlar o menu

  const router = useRouter();

  const fetchData = async () => {
    try {
      setRefreshing(true);
      if (!user?.uid) throw new Error('Usuário não autenticado ou UID ausente');

      // Fetch user data
      const userDocRef = doc(db, 'funcionarios', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) throw new Error('Usuário não encontrado');
      const data = userDoc.data() as UserData;
      setUserData(data);

      // Fetch company name
      const companyDocRef = doc(db, 'empresas', data.empresaId);
      const companyDoc = await getDoc(companyDocRef);
      if (companyDoc.exists()) setCompanyName(companyDoc.data().nomeFantasia);

      // Fetch confirmed solicitations
      const solicitacoesRef = collection(db, 'solicitacoes');
      const q = query(
        solicitacoesRef,
        where('clienteId', '==', user.uid),
        where('status', '==', 'm run start'),
        where('services', '!=', null)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot || !querySnapshot.docs) {
        console.warn('Nenhum documento encontrado ou querySnapshot inválido');
        setServicosContratados(0);
        setHistoricoSolicitacoes([]);
        return;
      }

      setServicosContratados(querySnapshot.size);

      const solicitacoesList = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const solicitacaoData = doc.data();
          if (!Array.isArray(solicitacaoData.services)) {
            console.warn(`Solicitação ${doc.id} ignorada: campo 'services' inválido`);
            return null;
          }

          const servicesWithCredenciado = await Promise.all(
            solicitacaoData.services.map(async (service: Service) => {
              const credenciadoNome = await getNameCredenciado(service.credenciado_id);
              return { ...service, empresa_nome: credenciadoNome };
            })
          );

          return {
            id: doc.id,
            services: servicesWithCredenciado,
            total: solicitacaoData.total || 0,
            createdAt: solicitacaoData.createdAt || { seconds: 0 },
          };
        })
      );

      const validSolicitacoes = solicitacoesList.filter((solicitation): solicitation is Solicitation => solicitation !== null);
      setHistoricoSolicitacoes(validSolicitacoes.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds));
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Erro no fetchData:', error.message, error.stack);
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
      setTimeout(() => {
        router.push({ pathname: '/ResetToRoot' });
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
        console.error('Credenciado não encontrado para ID:', donoId);
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
      router.push({ pathname: '/ResetToRoot' });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      alert('Erro ao sair da conta. Tente novamente.');
    } finally {
      setLogoutLoading(false);
      console.log('Finalizando processo de logout');
    }
  };

  // Função para desativar a conta
  const handleDisableAccount = async () => {
    if (!user) return;

    try {
      const userDocRef = doc(db, 'funcionarios', user.uid);
      await updateDoc(userDocRef, { status: 'disabled' });
      Alert.alert('Sucesso', 'Sua conta foi desativada.');
      await signOut(auth);
      console.log('Logout concluído com sucesso');
      router.push({ pathname: '/ResetToRoot' });
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
    setMenuVisible(false);
  };

  const toggleExpand = (solicitationId: string) => {
    setExpandedSolicitationId(expandedSolicitationId === solicitationId ? null : solicitationId);
  };

  const renderServiceItem = (service: Service) => (
    <View style={styles.serviceItem} key={service.serviceId}>
      <View>
        <Text style={styles.serviceName}>{service.nome_servico}</Text>
        <Text style={styles.companyName}>{service.empresa_nome}</Text>
        <Text style={styles.serviceDetails}>Quantidade: {service.quantity}</Text>
        <Text style={styles.serviceDetails}>
          Preço Unitário: R$ {service.preco.toFixed(2).replace('.', ',')}
        </Text>
        <Text style={styles.serviceDetails}>
          Total: R$ {service.total.toFixed(2).replace('.', ',')}
        </Text>
      </View>
    </View>
  );

  const renderSolicitationItem = (solicitation: Solicitation) => {
    const isExpanded = expandedSolicitationId === solicitation.id;
    return (
      <View key={solicitation.id} style={styles.solicitationItem}>
        <TouchableOpacity onPress={() => toggleExpand(solicitation.id)} style={styles.solicitationHeader}>
          <View>
            <Text style={styles.solicitationTitle}>
              Solicitação #{solicitation.id.slice(0, 8)} ({solicitation.services.length} serviços)
            </Text>
            <Text style={styles.solicitationDate}>
              {solicitation.createdAt
                ? new Date(solicitation.createdAt.seconds * 1000).toLocaleDateString('pt-BR')
                : 'Sem data'}
            </Text>
            <Text style={styles.solicitationTotal}>
              Total: R$ {solicitation.total.toFixed(2).replace('.', ',')}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#003087"
          />
        </TouchableOpacity>
        {isExpanded && (
          <View style={styles.servicesContainer}>
            {solicitation.services.map(renderServiceItem)}
          </View>
        )}
      </View>
    );
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
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(!menuVisible)}
        >
          <Ionicons name="menu-outline" size={30} color="white" />
        </TouchableOpacity>
        {menuVisible && (
          <View style={styles.menuDropdown}>
            <TouchableOpacity style={styles.menuItem} onPress={confirmDisableAccount}>
              <Ionicons name="trash-outline" size={20} color="#FF0000" />
              <Text style={styles.menuText}>Apagar Conta</Text>
            </TouchableOpacity>
          </View>
        )}
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
            <Text style={styles.dashboardLabel}>Solicitações Confirmadas:</Text>
            <Text style={styles.dashboardInfo}>{servicosContratados}</Text>
          </View>
          <Text style={styles.sectionTitle}>Histórico de Solicitações Confirmadas</Text>
          {historicoSolicitacoes.length > 0 ? (
            historicoSolicitacoes.map(renderSolicitationItem)
          ) : (
            <Text style={styles.noServiceText}>Nenhuma solicitação confirmada.</Text>
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
  solicitationItem: {
    backgroundColor: '#F5F7FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  solicitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  solicitationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#003087',
  },
  solicitationDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 2,
  },
  solicitationTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003087',
    marginTop: 2,
  },
  servicesContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 10,
  },
  serviceItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
    marginBottom: 5,
    borderRadius: 5,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  companyName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginTop: 2,
  },
  serviceDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  noServiceText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginVertical: 10,
  },
  menuButton: {
    position: 'absolute',
    top: 50,
    right: 20,
  },
  menuDropdown: {
    position: 'absolute',
    top: 90,
    right: 20,
    backgroundColor: '#FFF',
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
    fontWeight: '500',
  },
});