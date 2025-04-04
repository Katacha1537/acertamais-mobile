import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
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

interface Service {
    id: string;
    nome_servico: string;
    descricao: string;
    preco_original: number;
    preco_com_desconto?: number; // Campo opcional
    imagemUrl: string;
    credenciado_id: string;
    segmento?: string;
    empresa_nome?: string;
}

export default function ServicesScreen() {
    const { credenciadoId } = useLocalSearchParams<{ credenciadoId?: string }>();
    const router = useRouter();
    const [servicos, setServicos] = useState<Service[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const servicosRef = collection(db, 'servicos');
                const snapshot = await getDocs(servicosRef);
                const servicesData: Service[] = [];

                for (let docSnapshot of snapshot.docs) {
                    const serviceData = { id: docSnapshot.id, ...docSnapshot.data() } as Service;
                    const credenciadoRef = doc(db, 'credenciados', serviceData.credenciado_id);
                    const credenciadoSnapshot = await getDoc(credenciadoRef);

                    if (credenciadoSnapshot.exists()) {
                        const credenciadoData = credenciadoSnapshot.data();
                        serviceData.segmento = credenciadoData.segmento;
                        serviceData.empresa_nome = credenciadoData.nomeFantasia;
                    }
                    servicesData.push(serviceData);
                }

                const filteredServices = credenciadoId
                    ? servicesData.filter((service) => service.credenciado_id === credenciadoId)
                    : servicesData;

                setServicos(filteredServices);
            } catch (error) {
                console.error('Erro ao carregar serviços:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [credenciadoId]);

    const renderItem = ({ item }: { item: Service }) => {
        // Verifica se preco_com_desconto existe e é menor que preco_original
        const hasDiscount = item.preco_com_desconto !== undefined && item.preco_original > item.preco_com_desconto;
        const discountPercentage = hasDiscount
            ? (((item.preco_original - (item.preco_com_desconto ?? 0)) / item.preco_original) * 100).toFixed(0)
            : null;

        return (
            <View style={styles.card}>
                <Image source={{ uri: item.imagemUrl }} style={styles.image} />
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
                    onPress={() => router.push({
                        pathname: '/ServiceDetailsScreen',
                        params: { service: JSON.stringify(item) }
                    })}
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
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>
            <FlatList
                data={servicos}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.empty}>Nenhum serviço encontrado</Text>}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingTop: 40,
    },
    backButton: {
        padding: 10,
    },
    backText: {
        color: '#003DA5',
        fontSize: 16,
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
        color: 'green'
    },
    originalPrice: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    segment: {
        fontSize: 14,
        color: '#666',
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
});