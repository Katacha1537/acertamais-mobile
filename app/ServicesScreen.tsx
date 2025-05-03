import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    where,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../service/firebase';

interface Service {
    id: string;
    nome_servico: string;
    descricao: string;
    preco_original: number;
    preco_com_desconto?: number;
    imagemUrl: string;
    credenciado_id: string;
    segmento?: string;
    empresa_nome?: string;
}

export default function ServicesScreen() {
    const { credenciadoId } = useLocalSearchParams<{ credenciadoId?: string }>();
    const router = useRouter();
    const [servicos, setServicos] = useState<Service[]>([]);
    const [filteredServicos, setFilteredServicos] = useState<Service[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [indexError, setIndexError] = useState<boolean>(false);

    const fetchServices = useCallback(async () => {
        try {
            setLoading(true);

            let servicesQuery = query(
                collection(db, 'servicos'),
                orderBy('nome_servico')
            );

            if (credenciadoId) {
                servicesQuery = query(
                    collection(db, 'servicos'),
                    where('credenciado_id', '==', credenciadoId),
                    orderBy('nome_servico')
                );
            }

            console.log('Fetching all services');
            const snapshot = await getDocs(servicesQuery);
            console.log('Documents fetched:', snapshot.docs.length);

            const servicesData: Service[] = [];
            const credenciadosCache: { [key: string]: { segmento: string; nomeFantasia: string } } = {};

            for (let docSnapshot of snapshot.docs) {
                const serviceData = { id: docSnapshot.id, ...docSnapshot.data() } as Service;

                if (!credenciadosCache[serviceData.credenciado_id]) {
                    try {
                        const credenciadoRef = doc(db, 'credenciados', serviceData.credenciado_id);
                        const credenciadoSnapshot = await getDoc(credenciadoRef);
                        if (credenciadoSnapshot.exists()) {
                            const credenciadoData = credenciadoSnapshot.data();
                            credenciadosCache[serviceData.credenciado_id] = {
                                segmento: credenciadoData.segmento || 'Desconhecido',
                                nomeFantasia: credenciadoData.nomeFantasia || 'Sem nome',
                            };
                        } else {
                            credenciadosCache[serviceData.credenciado_id] = {
                                segmento: 'Desconhecido',
                                nomeFantasia: 'Sem nome',
                            };
                        }
                    } catch (error) {
                        console.warn(`Erro ao buscar credenciado ${serviceData.credenciado_id}:`, error);
                        credenciadosCache[serviceData.credenciado_id] = {
                            segmento: 'Desconhecido',
                            nomeFantasia: 'Sem nome',
                        };
                    }
                }

                serviceData.segmento = credenciadosCache[serviceData.credenciado_id].segmento;
                serviceData.empresa_nome = credenciadosCache[serviceData.credenciado_id].nomeFantasia;
                servicesData.push(serviceData);
            }

            console.log('Services processed:', servicesData.length);
            setServicos(servicesData);
            setFilteredServicos(servicesData);
            setIndexError(false);
        } catch (error: any) {
            console.error('Erro ao carregar serviços:', error);
            if (error.code === 'failed-precondition' && error.message.includes('requires an index')) {
                setIndexError(true);
                console.log('Índice necessário. Crie o índice no console do Firebase.');
            }
        } finally {
            setLoading(false);
        }
    }, [credenciadoId]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredServicos(servicos);
        } else {
            const filtered = servicos.filter((service) =>
                service.nome_servico.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredServicos(filtered);
        }
    }, [searchQuery, servicos]);

    const renderItem = ({ item }: { item: Service }) => {
        const hasDiscount =
            item.preco_com_desconto !== undefined && item.preco_original > item.preco_com_desconto;
        const discountPercentage = hasDiscount
            ? (((item.preco_original - (item.preco_com_desconto ?? 0)) / item.preco_original) * 100).toFixed(0)
            : null;

        return (
            <View style={styles.card}>
                {item.imagemUrl && <Image source={{ uri: item.imagemUrl }} style={styles.image} />}
                {hasDiscount && (
                    <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
                    </View>
                )}
                <Text style={styles.title}>{item.nome_servico}</Text>
                <Text style={styles.description}>{item.descricao}</Text>
                <View style={styles.footer}>
                    <Text style={styles.price}>
                        {hasDiscount ? (
                            <>
                                <Text style={styles.originalPrice}>R$ {item.preco_original} </Text>
                                R$ {item.preco_com_desconto}
                            </>
                        ) : (
                            `R$ ${item.preco_original}`
                        )}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() =>
                        router.push({
                            pathname: '/ServiceDetailsScreen',
                            params: { service: JSON.stringify(item) },
                        })
                    }
                >
                    <Text style={styles.buttonText}>Ver Detalhes</Text>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#003DA5" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>Voltar</Text>
                </TouchableOpacity>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Pesquisar por nome do serviço"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => router.push('/CartScreen')}
                >
                    <FontAwesome name="shopping-cart" size={24} color="#003DA5" />
                </TouchableOpacity>
            </View>
            <FlatList
                data={filteredServicos}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.empty}>Nenhum serviço encontrado</Text>}
                contentContainerStyle={styles.listContent}
            />
            {indexError && (
                <View style={styles.footerLoader}>
                    <Text style={styles.errorText}>
                        Erro ao carregar serviços. Tente novamente mais tarde.
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingTop: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    backButton: {
        padding: 10,
    },
    backText: {
        color: '#003DA5',
        fontSize: 16,
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#DDD',
        marginRight: 10,
    },
    cartButton: {
        padding: 10,
    },
    listContent: {
        padding: 15,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 8,
        marginBottom: 15,
        padding: 10,
    },
    image: {
        width: '100%',
        height: 120,
        borderRadius: 8,
    },
    discountBadge: {
        position: 'absolute',
        top: 15,
        right: 15,
        backgroundColor: '#FF5722',
        padding: 5,
        borderRadius: 12,
    },
    discountText: {
        color: '#FFF',
        fontSize: 12,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 5,
    },
    description: {
        fontSize: 14,
        color: '#666',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'green',
    },
    originalPrice: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    button: {
        backgroundColor: '#003DA5',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 14,
    },
    loading: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    empty: {
        textAlign: 'center',
        fontSize: 16,
        color: '#666',
        padding: 20,
    },
    footerLoader: {
        padding: 20,
        alignItems: 'center',
    },
    errorText: {
        fontSize: 14,
        color: '#FF0000',
        textAlign: 'center',
    },
});