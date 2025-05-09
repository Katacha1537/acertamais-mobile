import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../service/firebase';

interface Service {
    serviceId: string;
    nome_servico: string;
    descricao: string;
    preco: number;
    quantity: number;
    total: number;
    credenciado_id: string;
    empresa_nome: string;
    imagemUrl: string;
}

interface Request {
    id: string;
    clienteId: string;
    clienteNome: string;
    services: Service[];
    total: number;
    status: string;
    isDeleted: boolean;
}

interface PendingRequestsScreenProps {
    navigation: any;
}

const PendingRequestsScreen: React.FC<PendingRequestsScreenProps> = ({ navigation }) => {
    const { user } = useContext(AuthContext) || {};
    const [pendingRequests, setPendingRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);

    const fetchRequests = () => {
        if (!user?.uid) {
            setLoading(false);
            setRefreshing(false);
            return () => { };
        }

        const q = query(
            collection(db, 'solicitacoes'),
            where('clienteId', '==', user.uid),
            where('status', '==', 'pendente')
        );

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const requestsList = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as Request[];
                setPendingRequests(requestsList);
                setLoading(false);
                setRefreshing(false);
            },
            (error) => {
                console.error('Erro ao buscar solicitações:', error);
                setLoading(false);
                setRefreshing(false);
                Alert.alert('Erro', 'Não foi possível carregar suas solicitações.');
            }
        );

        return unsubscribe;
    };

    useEffect(() => {
        const unsubscribe = fetchRequests();
        return () => unsubscribe();
    }, [user?.uid]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const handleCancelRequest = async (requestId: string) => {
        try {
            const requestRef = doc(db, 'solicitacoes', requestId);
            await updateDoc(requestRef, {
                status: 'cancelada',
                isDeleted: true,
            });
            Alert.alert('Sucesso', 'Solicitação cancelada com sucesso!');
        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error('Erro ao cancelar solicitação:', error);
                Alert.alert('Erro', 'Não foi possível cancelar a solicitação: ' + error.message);
            } else {
                console.error('Erro desconhecido ao cancelar solicitação:', error);
                Alert.alert('Erro', 'Ocorreu um erro desconhecido ao cancelar a solicitação.');
            }
        }
    };

    const confirmCancel = (requestId: string) => {
        Alert.alert(
            'Confirmar Cancelamento',
            'Deseja realmente cancelar esta solicitação?',
            [
                { text: 'Não', style: 'cancel' },
                { text: 'Sim', onPress: () => handleCancelRequest(requestId) },
            ]
        );
    };

    const toggleExpand = (requestId: string) => {
        setExpandedRequestId(expandedRequestId === requestId ? null : requestId);
    };

    const renderServiceItem = ({ item }: { item: Service }) => (
        <View style={styles.serviceItem}>
            <Text style={styles.serviceName}>{item.nome_servico}</Text>
            <Text style={styles.description}>{item.descricao}</Text>
            <Text style={styles.serviceDetails}>
                Quantidade: {item.quantity}
            </Text>
            <Text style={styles.serviceDetails}>
                Preço Unitário: R$ {item.preco.toFixed(2).replace('.', ',')}
            </Text>
            <Text style={styles.serviceDetails}>
                Total: R$ {item.total.toFixed(2).replace('.', ',')}
            </Text>
            <Text style={styles.company}>{item.empresa_nome}</Text>
        </View>
    );

    const renderRequestItem = ({ item }: { item: Request }) => {
        const isExpanded = expandedRequestId === item.id;
        return (
            <View style={styles.requestItem}>
                <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.requestHeader}>
                    <Text style={styles.requestTitle}>
                        Solicitação #{item.id.slice(0, 8)} - Total: R$ {item.total.toFixed(2).replace('.', ',')}
                    </Text>
                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#003DA5"
                    />
                </TouchableOpacity>
                {isExpanded && (
                    <View style={styles.servicesContainer}>
                        <FlatList
                            data={item.services}
                            renderItem={renderServiceItem}
                            keyExtractor={(service) => service.serviceId}
                            contentContainerStyle={styles.servicesList}
                        />
                    </View>
                )}
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => confirmCancel(item.id)}
                >
                    <Ionicons name="close" size={16} color="#FFF" />
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (!user) {
        router.push({ pathname: '/' });
        return (
            <View style={styles.container}>
                <Text style={styles.noUserText}>Faça login para ver suas solicitações.</Text>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Carregando...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <Text style={styles.title}>Minhas Solicitações Pendentes</Text>
            {pendingRequests.length === 0 ? (
                <Text style={styles.noRequestsText}>Nenhuma solicitação pendente encontrada.</Text>
            ) : (
                <FlatList
                    data={pendingRequests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRequestItem}
                    contentContainerStyle={[styles.listContainer, { paddingBottom: 20 }]} // Adiciona padding inferior
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#003DA5']}
                            tintColor={'#003DA5'}
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default PendingRequestsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F4F7FC',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#003DA5',
        marginBottom: 20,
        textAlign: 'left',
    },
    requestItem: {
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    requestTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#003DA5',
    },
    servicesContainer: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
    },
    servicesList: {
        paddingBottom: 10,
    },
    serviceItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    serviceName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    description: {
        fontSize: 12,
        color: '#555',
        marginVertical: 5,
    },
    serviceDetails: {
        fontSize: 12,
        color: '#666',
    },
    company: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    cancelButton: {
        flexDirection: 'row',
        backgroundColor: '#FF4444',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginTop: 10,
    },
    cancelButtonText: {
        fontSize: 14,
        color: '#FFF',
        marginLeft: 5,
        fontWeight: 'bold',
    },
    noRequestsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    noUserText: {
        fontSize: 18,
        color: '#666',
        textAlign: 'center',
        marginTop: 50,
    },
    loadingText: {
        fontSize: 18,
        color: '#003DA5',
        textAlign: 'center',
        marginTop: 50,
    },
    listContainer: {
        paddingBottom: 20,
    },
});