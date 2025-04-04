import { useAuth } from '@/context/AuthContext';
import { db } from '@/service/firebase';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons'; // Importando ícones
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

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

    const handleSolicitarServico = async () => {
        console.log('Botão Solicitar clicado');
        if (loading) {
            console.log('Solicitação em andamento, ignorando clique');
            return;
        }

        if (!user?.uid) {
            console.log('Usuário não autenticado, redirecionando para login');
            Alert.alert('Faça login para solicitar serviços!');
            router.push('/');
            return;
        }

        setLoading(true);
        console.log('Iniciando solicitação de serviço...');

        try {
            const solicitacao = {
                clienteId: user.uid,
                clienteNome: user.displayName || 'Cliente',
                createdAt: serverTimestamp(),
                descricao: service.descricao,
                donoId: service.credenciado_id,
                nome_servico: service.nome_servico,
                preco: service.preco_com_desconto || service.preco_original,
                status: 'pendente',
                allowContact: true,
            };
            console.log('Dados da solicitação:', solicitacao);

            const docRef = await addDoc(collection(db, 'solicitacoes'), solicitacao);
            console.log('Solicitação criada com ID:', docRef.id);

            if (isMounted.current) {
                Alert.alert('Serviço solicitado com sucesso!');
                console.log('Navegando de volta');
                router.back();
            } else {
                console.log('Componente desmontado antes da navegação');
            }
        } catch (error) {
            console.error('Erro ao solicitar serviço:', error);
            if (isMounted.current) {
                Alert.alert('Erro ao solicitar', (error as Error).message);
            }
        } finally {
            if (isMounted.current) {
                console.log('Finalizando solicitação, loading:', false);
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
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <Image source={{ uri: service.imagemUrl }} style={styles.image} />
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
                Ao solicitar, você permite contato por email ou telefone.
            </Text>

            <TouchableOpacity
                style={[styles.button, styles.actionButton, loading && styles.disabled]}
                onPress={handleSolicitarServico}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Enviando...' : 'Solicitar Serviço'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    contentContainer: {
        padding: 15,
        paddingTop: Platform.OS === 'android' ? 30 : 15, // Ajuste para Android
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