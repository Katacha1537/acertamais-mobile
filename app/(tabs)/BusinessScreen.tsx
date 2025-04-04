import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../service/firebase";

// Tipos para os dados
interface Credenciado {
    id: string;
    nomeFantasia: string;
    endereco: string;
    segmento: string; // ID do segmento
    imagemUrl: string;
}

interface Segmento {
    id: string;
    nome: string;
}

export default function BusinessScreenT() {
    const [credenciados, setCredenciados] = useState<Credenciado[]>([]);
    const [filteredCredenciados, setFilteredCredenciados] = useState<Credenciado[]>([]);
    const [segmentos, setSegmentos] = useState<Segmento[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSegment, setSelectedSegment] = useState<string>("Todos");
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log("Iniciando fetchData...");
                setLoading(true);
                setError(null);

                // Buscar segmentos
                const segmentosRef = collection(db, "segmentos");
                const segmentosSnapshot = await getDocs(segmentosRef);
                const segmentosData: Segmento[] = segmentosSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    nome: doc.data().nome || "Segmento não disponível",
                }));
                setSegmentos(segmentosData);
                console.log("Segmentos carregados:", segmentosData);

                // Buscar credenciados
                const credenciadosRef = collection(db, "credenciados");
                const snapshot = await getDocs(credenciadosRef);
                console.log("Snapshot recebido, docs:", snapshot.docs.length);

                const credenciadosData: Credenciado[] = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        nomeFantasia: data.nomeFantasia || "Nome não disponível",
                        endereco: data.endereco || "Endereço não disponível",
                        segmento: data.segmento || "Segmento não disponível",
                        imagemUrl: data.imagemUrl || "https://via.placeholder.com/80",
                    };
                });

                console.log("Credenciados carregados:", credenciadosData);
                setCredenciados(credenciadosData);
                setFilteredCredenciados(credenciadosData);
            } catch (error: any) {
                console.error("Erro ao carregar dados:", error.message);
                setError("Erro ao carregar os dados. Tente novamente.");
            } finally {
                setLoading(false);
                console.log("FetchData finalizado, loading:", false);
            }
        };

        fetchData();
    }, []);

    // Função para obter o nome do segmento a partir do ID
    const getSegmentoNome = (segmentoId: string) => {
        const segmento = segmentos.find((seg) => seg.id === segmentoId);
        return segmento ? segmento.nome : "Segmento não disponível";
    };

    // Filtrar credenciados com base no segmento selecionado
    useEffect(() => {
        if (selectedSegment === "Todos") {
            setFilteredCredenciados(credenciados);
        } else {
            const filtered = credenciados.filter((credenciado) => {
                const segmentoNome = getSegmentoNome(credenciado.segmento);
                return segmentoNome === selectedSegment;
            });
            setFilteredCredenciados(filtered);
        }
    }, [selectedSegment, credenciados, segmentos]);

    const handlePress = (credenciadoId: string) => {
        console.log("Navegando para ServicesScreen com credenciadoId:", credenciadoId);
        router.push({
            pathname: '/ServicesScreen',
            params: { credenciadoId },
        });
    };

    const handleSegmentChange = (segment: string) => {
        setSelectedSegment(segment);
    };

    // Função para renderizar cada item do FlatList
    const renderSegmento = ({ item }: { item: Segmento | { id: string; nome: string } }) => (
        <TouchableOpacity
            style={[
                styles.segmentButton,
                selectedSegment === item.nome && styles.segmentButtonActive,
            ]}
            onPress={() => handleSegmentChange(item.nome)}
        >
            <Text
                style={[
                    styles.segmentText,
                    selectedSegment === item.nome && styles.segmentTextActive,
                ]}
            >
                {item.nome}
            </Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003DA5" />
                <Text style={styles.loadingText}>Carregando...</Text>
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </SafeAreaView>
        );
    }

    // Dados para o FlatList (adicionando "Todos" como primeiro item)
    const segmentData = [{ id: "todos", nome: "Todos" }, ...segmentos];

    return (
        <SafeAreaView style={styles.container}>
            {/* Segment Control com FlatList Horizontal */}
            <FlatList
                horizontal
                data={segmentData}
                renderItem={renderSegmento}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                style={styles.segmentContainer}
                contentContainerStyle={styles.segmentContent}
            />

            {/* List of Credenciados */}
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {filteredCredenciados.length === 0 ? (
                    <Text style={styles.emptyText}>Nenhuma empresa encontrada.</Text>
                ) : (
                    filteredCredenciados.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.card}
                            onPress={() => handlePress(item.id)}
                        >
                            <Image
                                source={{ uri: item.imagemUrl }}
                                style={styles.logoImage}
                            />
                            <View style={styles.cardContent}>
                                <Text style={styles.nomeFantasia}>{item.nomeFantasia}</Text>
                                <View style={styles.infoRow}>
                                    <Ionicons name="location-outline" size={16} color="#555" />
                                    <Text style={styles.info}>{item.endereco}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Ionicons name="briefcase-outline" size={16} color="#555" />
                                    <Text style={styles.info}>{getSegmentoNome(item.segmento)}</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handlePress(item.id)}
                                >
                                    <Text style={styles.buttonText}>Ver Serviços</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F7FC",
    },
    segmentContainer: {
        flex: 0.1,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#E0E0E0",
    },
    segmentContent: {
        marginTop: 45
    },
    segmentButton: {
        height: 40,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 8,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E0E0E0",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    segmentButtonActive: {
        backgroundColor: "#003DA5",
        borderColor: "#003DA5",
    },
    segmentText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        textAlign: "center",
    },
    segmentTextActive: {
        color: "#FFFFFF",
        fontWeight: "700",
    },
    scrollContent: {
        padding: 10, // Reduzido o padding para diminuir o espaço
        paddingTop: 5, // Ajustado para minimizar o espaço entre os segmentos e a lista
    },
    card: {
        flexDirection: "row",
        backgroundColor: "#FFF",
        borderRadius: 10,
        padding: 15,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    cardContent: {
        flex: 1,
    },
    logoImage: {
        width: 60,
        height: 60,
        borderRadius: 10,
        marginRight: 15,
        backgroundColor: "#eee",
    },
    nomeFantasia: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#003DA5",
        marginBottom: 5,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    info: {
        fontSize: 14,
        color: "#555",
        marginLeft: 5,
    },
    actionButton: {
        backgroundColor: "#003DA5",
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 10,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#FFF",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F4F7FC",
    },
    loadingText: {
        fontSize: 18,
        color: "#003DA5",
        marginTop: 10,
    },
    errorText: {
        fontSize: 18,
        color: "red",
        textAlign: "center",
    },
    emptyText: {
        fontSize: 16,
        color: "#555",
        textAlign: "center",
        marginTop: 20,
    },
});