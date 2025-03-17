import { useAuth } from '@/context/AuthContext';
import { db } from '@/service/firebase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Building2, DollarSign, MapPin, Phone } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Definição dos tipos
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
    const params = useLocalSearchParams(); // Pega os parâmetros da rota
    const router = useRouter(); // Para navegação
    const service: Service = JSON.parse(params.service as string); // Converte o serviço de string JSON para objeto
    const { user } = useAuth();
    const [loading, setLoading] = useState<boolean>(false);
    const [credenciado, setCredenciado] = useState<Credenciado | string>('');

    useEffect(() => {
        if (!service?.credenciado_id) return;

        const fetchCredenciado = async () => {
            try {
                const credenciadoRef = doc(db, 'credenciados', service.credenciado_id);
                const credenciadoSnap = await getDoc(credenciadoRef);
                if (credenciadoSnap.exists()) {
                    const data = credenciadoSnap.data() as Credenciado;
                    setCredenciado(data || 'Credenciado não disponível');
                } else {
                    setCredenciado('Credenciado não encontrado');
                }
            } catch (error) {
                console.error('Erro ao buscar Credenciado do credenciado:', error);
                setCredenciado('Erro ao carregar Credenciado');
            }
        };
        fetchCredenciado();
    }, [service?.credenciado_id]);

    const handleSolicitarServico = async () => {
        if (loading) return;

        if (!user?.uid) {
            alert('Faça login para solicitar serviços!');
            router.push('/'); // Ajustado para Expo Router
            return;
        }

        setLoading(true);
        try {
            const solicitacao = {
                clienteId: user.uid,
                clienteNome: user.displayName || 'Cliente',
                createdAt: serverTimestamp(),
                descricao: service?.descricao || '',
                donoId: service?.credenciado_id || '',
                nome_servico: service?.nome_servico || '',
                preco: service?.preco_com_desconto || service?.preco_original || 0,
                status: 'pendente',
                allowContact: true,
            };
            await addDoc(collection(db, 'solicitacoes'), solicitacao);
            alert('Serviço solicitado com sucesso!');
            router.back(); // Volta para a tela anterior
        } catch (error) {
            console.error('Erro ao solicitar serviço: ', error);
            alert('Erro ao solicitar: ' + (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const openMap = () => {
        if (typeof credenciado !== 'string' && credenciado.endereco) {
            const url = Platform.select({
                ios: `maps://?q=${encodeURIComponent(credenciado.endereco)}`,
                android: `geo:0,0?q=${encodeURIComponent(credenciado.endereco)}`,
            });
            Linking.openURL(url!).catch((err) => console.error('Erro ao abrir mapa:', err));
        }
    };

    if (!service) {
        return <Text>Erro: Nenhum serviço fornecido</Text>;
    }

    return (
        <ScrollView style={styles.container}>
            <Image source={{ uri: service.imagemUrl }} style={styles.serviceImage} />
            <Text style={styles.serviceName}>{service.nome_servico}</Text>
            <Text style={styles.serviceDescription}>{service.descricao}</Text>

            <View style={styles.infoContainer}>
                <Building2 size={24} color="#003DA5" style={styles.icon} />
                <Text style={styles.infoText}>{service.empresa_nome}</Text>
            </View>

            <View style={styles.infoContainer}>
                <Phone size={24} color="#003DA5" style={styles.icon} />
                <Text style={styles.infoText}>
                    {typeof credenciado === 'string' ? credenciado : credenciado.telefone}
                </Text>
            </View>

            <View style={styles.infoContainer}>
                <MapPin size={24} color="#003DA5" style={styles.icon} />
                <Text style={styles.infoText}>
                    {typeof credenciado === 'string' ? credenciado : credenciado.endereco}
                </Text>
            </View>

            <View style={styles.infoContainer}>
                <DollarSign size={24} color="#003DA5" style={styles.icon} />
                <Text style={styles.infoText}>
                    {service.preco_com_desconto
                        ? `R$ ${service.preco_com_desconto}`
                        : `R$ ${service.preco_original}`}
                </Text>
            </View>

            <TouchableOpacity style={styles.mapButton} onPress={openMap}>
                <Text style={styles.buttonText}>Ver no Mapa</Text>
            </TouchableOpacity>

            {/* Mensagem de consentimento */}
            <Text style={styles.consentText}>
                Ao solicitar este serviço, você concorda que a empresa pode entrar em contato por email ou telefone.
            </Text>

            <TouchableOpacity
                style={[styles.actionButton, loading && styles.disabledButton]}
                onPress={handleSolicitarServico}
                disabled={loading}
            >
                <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Solicitar Serviço'}</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 50,
        backgroundColor: '#F4F7FC',
    },
    disabledButton: {
        backgroundColor: '#cccccc',
        opacity: 0.7,
    },
    serviceImage: {
        width: '100%',
        height: 200,
        borderRadius: 15,
        marginBottom: 20,
    },
    serviceName: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#003DA5',
        marginBottom: 10,
    },
    serviceDescription: {
        fontSize: 16,
        color: '#555',
        marginBottom: 20,
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    icon: {
        marginRight: 10,
    },
    infoText: {
        fontSize: 18,
        color: '#333',
    },
    consentText: {
        fontSize: 14,
        color: '#666',
        marginTop: 15,
        textAlign: 'center',
    },
    mapButton: {
        backgroundColor: '#007BFF',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginVertical: 10,
    },
    actionButton: {
        backgroundColor: '#003DA5',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
});