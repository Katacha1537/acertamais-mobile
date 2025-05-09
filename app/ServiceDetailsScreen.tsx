import { useAuth } from '@/context/AuthContext';
import { db } from '@/service/firebase';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Service {
    id: string;
    nome_servico: string;
    descricao: string;
    preco_original: number;
    preco_com_desconto?: number;
    imagemUrl: string;
    credenciado_id: string;
    empresa_nome?: string;
}

interface Credenciado {
    nomeFantasia?: string;
    telefone?: string;
    endereco?: string;
}

export default function ServiceDetailsScreen() {
    const params = useLocalSearchParams<{ service: string }>();
    const router = useRouter();
    const service: Service = JSON.parse(params.service);
    const { user } = useAuth();
    const [loading, setLoading] = useState<boolean>(false);
    const [credenciado, setCredenciado] = useState<Credenciado | string>('');
    const isMounted = useRef(true);

    useEffect(() => {
        console.log('Componente montado');
        if (!service?.credenciado_id) return;

        const fetchCredenciado = async () => {
            try {
                console.log('Buscando credenciado para ID:', service.credenciado_id);
                const credenciadoRef = doc(db, 'credenciados', service.credenciado_id);
                const credenciadoSnap = await getDoc(credenciadoRef);
                if (credenciadoSnap.exists()) {
                    setCredenciado(credenciadoSnap.data() as Credenciado);
                    console.log('Credenciado carregado:', credenciadoSnap.data());
                } else {
                    setCredenciado('Credenciado não encontrado');
                    console.log('Credenciado não encontrado');
                }
            } catch (error) {
                console.error('Erro ao buscar credenciado:', error);
                setCredenciado('Erro ao carregar');
            }
        };
        fetchCredenciado();

        return () => {
            console.log('Componente desmontado');
            isMounted.current = false;
        };
    }, [service?.credenciado_id]);

    const handleAddToCart = async () => {
        console.log('Botão Adicionar ao Carrinho clicado');
        if (loading) {
            console.log('Adição em andamento, ignorando clique');
            return;
        }

        if (!user?.uid) {
            console.log('Usuário não autenticado, redirecionando para login');
            Alert.alert('Faça login para adicionar ao carrinho!');
            router.push('/');
            return;
        }

        setLoading(true);
        console.log('Iniciando adição ao carrinho...');

        try {
            // Fetch current cart items to check credenciado_id
            const q = query(collection(db, 'carts'), where('userId', '==', user.uid));
            const snapshot = await getDocs(q);
            const cartItems = snapshot.docs.map((doc) => doc.data());

            // Check if cart is not empty and has items with different credenciado_id
            if (cartItems.length > 0) {
                const hasDifferentCredenciado = cartItems.some(
                    (item) => item.credenciado_id !== service.credenciado_id
                );
                if (hasDifferentCredenciado) {
                    Alert.alert(
                        'Atenção',
                        'É possível selecionar serviços de uma empresa por vez.'
                    );
                    console.log('Tentativa de adicionar serviço de credenciado diferente');
                    setLoading(false);
                    return;
                }
            }

            const cartItem = {
                userId: user.uid,
                serviceId: service.id,
                nome_servico: service.nome_servico,
                descricao: service.descricao,
                preco: service.preco_com_desconto || service.preco_original,
                credenciado_id: service.credenciado_id,
                empresa_nome: service.empresa_nome,
                imagemUrl: service.imagemUrl,
                createdAt: serverTimestamp(),
                quantity: 1, // Initialize quantity
            };
            console.log('Item do carrinho:', cartItem);

            const docRef = await addDoc(collection(db, 'carts'), cartItem);
            console.log('Item adicionado ao carrinho com ID:', docRef.id);

            if (isMounted.current) {
                Alert.alert('Serviço adicionado ao carrinho!', '', [
                    { text: 'Continuar', onPress: () => router.back() },
                    { text: 'Ir para o Carrinho', onPress: () => router.push('/CartScreen') },
                ]);
            }
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            if (isMounted.current) {
                Alert.alert('Erro ao adicionar', (error as Error).message);
            }
        } finally {
            if (isMounted.current) {
                console.log('Finalizando adição, loading:', false);
                setLoading(false);
            }
        }
    };

    const openMap = () => {
        console.log('Botão Ver no Mapa clicado');
        if (typeof credenciado !== 'string' && credenciado.endereco) {
            const url = Platform.select({
                ios: `maps://?q=${encodeURIComponent(credenciado.endereco)}`,
                android: `geo:0,0?q=${encodeURIComponent(credenciado.endereco)}`,
            });
            console.log('Abrindo mapa com URL:', url);
            Linking.openURL(url!).catch((err) => console.error('Erro ao abrir mapa:', err));
        } else {
            console.log('Endereço não disponível para mapa');
        }
    };

    if (!service) {
        console.log('Nenhum serviço fornecido');
        return <Text style={styles.error}>Erro: Nenhum serviço fornecido</Text>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>Voltar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() => router.push('/CartScreen')}
                >
                    <FontAwesome name="shopping-cart" size={24} color="#003DA5" />
                </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <Text style={styles.title}>{service.nome_servico}</Text>
                <Text style={styles.description}>{service.descricao}</Text>

                <View style={styles.infoContainer}>
                    <View style={styles.info}>
                        <MaterialIcons name="business" size={20} color="#003DA5" />
                        <Text style={styles.infoText}>{service.empresa_nome || 'Não informado'}</Text>
                    </View>

                    <View style={styles.info}>
                        <FontAwesome name="phone" size={20} color="#003DA5" />
                        <Text style={styles.infoText}>
                            {typeof credenciado === 'string' ? credenciado : credenciado.telefone || 'Não informado'}
                        </Text>
                    </View>

                    <View style={styles.info}>
                        <MaterialIcons name="location-on" size={20} color="#003DA5" />
                        <Text style={styles.infoText}>
                            {typeof credenciado === 'string' ? credenciado : credenciado.endereco || 'Não informado'}
                        </Text>
                    </View>

                    <View style={styles.info}>
                        <FontAwesome name="money" size={20} color="#003DA5" />
                        <Text style={styles.infoTextPrice}>
                            R$ {service.preco_com_desconto || service.preco_original}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.button} onPress={openMap}>
                    <Ionicons name="map" size={20} color="#FFF" />
                    <Text style={styles.buttonText}> Ver no Mapa</Text>
                </TouchableOpacity>

                <Text style={styles.consent}>
                    Ao adicionar ao carrinho, você permite contato por email ou telefone.
                </Text>

                <TouchableOpacity
                    style={[styles.button, styles.actionButton, loading && styles.disabled]}
                    onPress={handleAddToCart}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Adicionando...' : 'Adicionar ao Carrinho'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#DDD',
    },
    backButton: {
        padding: 10,
    },
    backText: {
        color: '#003DA5',
        fontSize: 16,
    },
    cartButton: {
        padding: 10,
    },
    contentContainer: {
        padding: 15,
        paddingTop: Platform.OS === 'android' ? 10 : 0,
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    infoContainer: {
        marginBottom: 20,
    },
    info: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 10,
    },
    infoTextPrice: {
        fontSize: 16,
        color: 'green',
        fontWeight: 'bold',
        marginLeft: 10,
    },
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007BFF',
        padding: 12,
        borderRadius: 5,
        marginVertical: 5,
    },
    actionButton: {
        backgroundColor: '#003DA5',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        marginLeft: 10,
    },
    consent: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        marginVertical: 10,
    },
    disabled: {
        backgroundColor: '#999',
    },
    error: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        padding: 20,
    },
});