import Ionicons from '@expo/vector-icons/Ionicons'; // Importando ícones do Expo
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { Boxes } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../service/firebase';

// Defina os tipos dos dados
interface Segmento {
    [key: string]: string;
}

interface Service {
    id: string;
    nome_servico: string;
    descricao: string;
    preco_original: number;
    preco_com_desconto: number;
    imagemUrl: string;
    credenciado_id: string;
    segmento?: string;
    empresa_nome?: string;
}

export default function ServicesScreen() {
    const { credenciadoId } = useLocalSearchParams();
    const router = useRouter(); // Para navegação de volta
    const [servicos, setServicos] = useState<Service[]>([]);
    const [segmentos, setSegmentos] = useState<Segmento>({});
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Buscar segmentos
                const segmentosRef = collection(db, 'segmentos');
                const segmentosSnapshot = await getDocs(segmentosRef);
                const segmentosData: Segmento = {};
                segmentosSnapshot.forEach((doc) => {
                    segmentosData[doc.id] = doc.data().nome;
                });
                setSegmentos(segmentosData);

                // Buscar serviços
                const servicosRef = collection(db, 'servicos');
                const snapshot = await getDocs(servicosRef);
                const servicesData: Service[] = [];

                for (let docSnapshot of snapshot.docs) {
                    const serviceData: Service = { id: docSnapshot.id, ...docSnapshot.data() } as Service;
                    const credenciadoRef = doc(db, 'credenciados', serviceData.credenciado_id);
                    const credenciadoSnapshot = await getDoc(credenciadoRef);

                    if (credenciadoSnapshot.exists()) {
                        const credenciadoData = credenciadoSnapshot.data();
                        serviceData.segmento = credenciadoData.segmento;
                        serviceData.empresa_nome = credenciadoData.nomeFantasia;
                    }

                    servicesData.push(serviceData);
                }

                // Filtra os serviços pelo credenciado_id
                const filteredServices = credenciadoId
                    ? servicesData.filter((service) => service.credenciado_id === credenciadoId)
                    : servicesData;

                setServicos(filteredServices);
            } catch (error) {
                console.error('Erro ao carregar os dados:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [credenciadoId]);

    // Função para voltar
    const handleBack = () => {
        router.back(); // Volta para a tela anterior
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003DA5" />
                <Text style={styles.loadingText}>Carregando serviços...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Botão de voltar no topo superior esquerdo */}
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={28} color="#003DA5" />
            </TouchableOpacity>

            {/* Verifica se há serviços */}
            {servicos.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>Nenhum serviço encontrado</Text>
                </View>
            ) : (
                <FlatList
                    data={servicos}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const hasDiscount =
                            item.preco_com_desconto && item.preco_original > item.preco_com_desconto;
                        const discountPercentage = hasDiscount
                            ? (
                                ((item.preco_original - item.preco_com_desconto) / item.preco_original) *
                                100
                            ).toFixed(0)
                            : null;
                        const segmentName = segmentos[item.segmento || ''] || 'Segmento não encontrado';

                        return (
                            <View style={styles.card}>
                                <Image source={{ uri: item.imagemUrl }} style={styles.serviceImage} />
                                {hasDiscount && (
                                    <View style={styles.discountBadge}>
                                        <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
                                    </View>
                                )}
                                <Text style={styles.serviceName}>{item.nome_servico}</Text>
                                <Text style={styles.serviceDescription}>{item.descricao}</Text>
                                <View style={styles.priceContainer}>
                                    <Text style={styles.servicePrice}>
                                        {hasDiscount ? (
                                            <>
                                                <Text style={styles.originalPrice}>R$ {item.preco_original}</Text>
                                                <Text style={styles.discountedPrice}> R$ {item.preco_com_desconto}</Text>
                                            </>
                                        ) : (
                                            `R$ ${item.preco_original}`
                                        )}
                                    </Text>
                                    <View style={styles.segmentContainer}>
                                        <Boxes size={16} color="#003DA5" />
                                        <Text style={styles.serviceSegment}>{segmentName}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => router.push({ pathname: '/ServiceDetailsScreen', params: { service: JSON.stringify(item) } })}
                                >
                                    <Text style={styles.buttonText}>Ver Detalhes</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    }}
                    contentContainerStyle={styles.flatListContent}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#F4F7FC',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1, // Garante que o botão fique acima da lista
    },
    flatListContent: {
        paddingBottom: 20,
        marginTop: 45
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        marginBottom: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    serviceImage: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    discountBadge: {
        backgroundColor: '#FF5722',
        position: 'absolute',
        top: 10,
        right: 10,
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 15,
    },
    discountText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    serviceName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        margin: 15,
    },
    serviceDescription: {
        fontSize: 14,
        color: '#777',
        marginHorizontal: 15,
        marginBottom: 10,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 15,
        marginBottom: 15,
    },
    servicePrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    originalPrice: {
        fontSize: 16,
        color: '#ee6e6e',
        textDecorationLine: 'line-through',
    },
    discountedPrice: {
        fontSize: 18,
        color: '#08ca08',
    },
    segmentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    serviceSegment: {
        fontSize: 14,
        color: '#888',
        marginLeft: 5,
    },
    actionButton: {
        backgroundColor: '#003DA5',
        paddingVertical: 15,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#777',
        textAlign: 'center',
    },
});