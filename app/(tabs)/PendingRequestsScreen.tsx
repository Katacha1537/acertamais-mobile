import { Ionicons } from '@expo/vector-icons'; // Import Ionicons from expo/vector-icons
import { router } from 'expo-router';
import { collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { db } from '../../service/firebase';

// Definir os tipos para os dados
interface Request {
    id: string;
    nome_servico: string;
    descricao: string;
    preco: number;
    clienteId: string;
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

    // Função para buscar solicitações
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

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestsList = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Request[]; // Garantir que o tipo seja correto
            setPendingRequests(requestsList);
            setLoading(false);
            setRefreshing(false);
        }, (error) => {
            console.error('Erro ao buscar solicitações:', error);
            setLoading(false);
            setRefreshing(false);
            Alert.alert('Erro', 'Não foi possível carregar suas solicitações.');
        });

        return unsubscribe;
    };

    // Efeito inicial
    useEffect(() => {
        const unsubscribe = fetchRequests();
        return () => unsubscribe();
    }, [user?.uid]);

    // Função para lidar com o refresh
    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    // Função para cancelar uma solicitação
    const handleCancelRequest = async (requestId: string) => {
        try {
            const requestRef = doc(db, 'solicitacoes', requestId);
            await updateDoc(requestRef, {
                status: 'cancelada',
                isDeleted: true
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

    // Confirmação antes de cancelar
    const confirmCancel = (requestId: string, serviceName: string) => {
        Alert.alert(
            'Confirmar Cancelamento',
            `Deseja realmente cancelar a solicitação para "${serviceName}"?`,
            [
                { text: 'Não', style: 'cancel' },
                { text: 'Sim', onPress: () => handleCancelRequest(requestId) },
            ]
        );
    };

    // Renderizar cada item da lista
    const renderRequestItem = ({ item }: { item: Request }) => (
        <View style={styles.requestItem}>
            <View style={styles.requestDetails}>
                <Text style={styles.serviceName}>{item.nome_servico}</Text>
                <Text style={styles.description}>{item.descricao}</Text>
                <Text style={styles.price}>
                    Preço: R$ {item.preco.toFixed(2).replace('.', ',')}
                </Text>
            </View>
            <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => confirmCancel(item.id, item.nome_servico)}
            >
                <Ionicons name="close" size={16} color="#FFF" />
                <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
        </View>
    );

    if (!user) {
        router.push({
            pathname: '/'
        })
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
        <View style={styles.container}>
            <Text style={styles.title}>Minhas Solicitações Pendentes</Text>
            {pendingRequests.length === 0 ? (
                <Text style={styles.noRequestsText}>Nenhuma solicitação pendente encontrada.</Text>
            ) : (
                <FlatList
                    data={pendingRequests}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRequestItem}
                    contentContainerStyle={styles.listContainer}
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
        </View>
    );
};

export default PendingRequestsScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#F4F7FC',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#003DA5',
        marginBottom: 20,
        textAlign: 'left', // Aligned to the left as in the image
    },
    requestItem: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    requestDetails: {
        flex: 1,
        marginRight: 10,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#003DA5',
    },
    description: {
        fontSize: 14,
        color: '#555',
        marginVertical: 5,
    },
    price: {
        fontSize: 14,
        color: 'green',
        fontWeight: '500',
    },
    cancelButton: {
        flexDirection: 'row',
        backgroundColor: '#FF4444',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignItems: 'center',
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