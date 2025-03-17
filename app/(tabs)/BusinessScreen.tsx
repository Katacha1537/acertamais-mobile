import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { Boxes, MapPin } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { db } from "../../service/firebase";

// Definindo os tipos para os dados dos credenciados e segmentos
interface Credenciado {
    id: string;
    nomeFantasia: string;
    endereco: string;
    segmento: string;
    imagemUrl?: string;
}

interface Segments {
    [key: string]: string;
}

interface BusinessScreenProps {
    navigation: any; // Definir o tipo de navegação conforme sua implementação (ex: usando React Navigation)
}

const BusinessScreen: React.FC<BusinessScreenProps> = () => {
    const [credenciados, setCredenciados] = useState<Credenciado[]>([]);
    const [segmentos, setSegmentos] = useState<Segments>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedSegment, setSelectedSegment] = useState<string>("all");
    const router = useRouter();
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Buscar segmentos
                const segmentosRef = collection(db, "segmentos");
                const segmentosSnapshot = await getDocs(segmentosRef);
                const segmentosData: Segments = {};
                segmentosSnapshot.forEach((doc) => {
                    segmentosData[doc.id] = doc.data().nome; // Assumindo que o campo é 'nome'
                });
                setSegmentos(segmentosData);

                // Buscar credenciados
                const credenciadosRef = collection(db, "credenciados");
                const snapshot = await getDocs(credenciadosRef);
                const credenciadosData: Credenciado[] = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    nomeFantasia: doc.data().nomeFantasia || "", // Verifique se o campo 'nomeFantasia' existe no seu banco de dados
                    endereco: doc.data().endereco || "", // Verifique se o campo 'endereco' existe no seu banco de dados
                    segmento: doc.data().segmento || "", // Verifique se o campo 'segmento' existe no seu banco de dados
                    imagemUrl: doc.data().imagemUrl, // Isso pode ser opcional
                }));

                setCredenciados(credenciadosData);
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredCredenciados = useMemo(() => {
        if (selectedSegment === "all") return credenciados;
        return credenciados.filter((item) => item.segmento === selectedSegment);
    }, [selectedSegment, credenciados]);

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003DA5" />
                <Text style={styles.loadingText}>Carregando credenciados...</Text>
            </SafeAreaView>
        );
    }

    const renderSegmentFilter = () => {
        const segmentsArray = [
            { key: "all", label: "Todos" },
            ...Object.entries(segmentos).map(([key, label]) => ({ key, label })),
        ];

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContainer}
            >
                {segmentsArray.map((segment) => (
                    <TouchableOpacity
                        key={segment.key}
                        style={[
                            styles.filterButton,
                            selectedSegment === segment.key && styles.filterButtonActive
                        ]}
                        onPress={() => setSelectedSegment(segment.key)}
                    >
                        <Text
                            style={[
                                styles.filterButtonText,
                                selectedSegment === segment.key && styles.filterButtonTextActive
                            ]}
                        >
                            {segment.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        );
    };

    const handlePress = (item: Credenciado) => {
        // Navega para ServiceScreen e passa um parâmetro (exemplo: id)
        router.push({
            pathname: '/ServicesScreen',
            params: { credenciadoId: item.id }, // Substitua '123' pelo valor desejado
        });
    };

    const renderCredenciadoItem = (item: Credenciado) => {
        const segmentName = segmentos[item.segmento] || "Segmento não encontrado";
        return (
            <View key={item.id} style={styles.card}>
                <Image
                    source={{ uri: item.imagemUrl || "https://via.placeholder.com/80" }} // Fallback para imagem
                    style={styles.logoImage}
                />
                <View style={styles.infoContainer}>
                    <Text style={styles.nomeFantasia}>{item.nomeFantasia}</Text>
                    <View style={styles.infoRow}>
                        <MapPin size={16} color="#003DA5" />
                        <Text style={styles.endereco}>{item.endereco || "Endereço não disponível"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Boxes size={16} color="#003DA5" />
                        <Text style={styles.segmento}>{segmentName}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handlePress(item)}
                    >
                        <Text style={styles.buttonText}>Ver Serviços</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeContainer}>
            <View style={styles.container}>
                {renderSegmentFilter()}
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {filteredCredenciados.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                Nenhum credenciado encontrado para esse segmento.
                            </Text>
                        </View>
                    ) : (
                        filteredCredenciados.map((item) => renderCredenciadoItem(item))
                    )}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeContainer: {
        flex: 1,
        backgroundColor: "#F4F7FC",
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#F4F7FC",
    },
    filterContainer: {
        paddingVertical: 5,
        height: 50,
        marginTop: 15,
    },
    filterButton: {
        backgroundColor: "#FFF",
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 15,
        marginRight: 10,
        borderWidth: 1,
        borderColor: "#003DA5",
        alignItems: "center",
        justifyContent: "center",
    },
    filterButtonActive: {
        backgroundColor: "#003DA5",
    },
    filterButtonText: {
        fontSize: 14,
        color: "#003DA5",
    },
    filterButtonTextActive: {
        color: "#FFF",
        fontWeight: "bold",
    },
    scrollContent: {
        paddingBottom: 20,
    },
    card: {
        backgroundColor: "#FFF",
        borderRadius: 15,
        marginBottom: 20,
        padding: 15,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    logoImage: {
        width: 80,
        height: 80,
        borderRadius: 10,
        marginRight: 15,
        backgroundColor: "#eee",
    },
    infoContainer: {
        flex: 1,
    },
    nomeFantasia: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#003DA5",
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 5,
    },
    endereco: {
        fontSize: 14,
        color: "#555",
        marginLeft: 5,
    },
    segmento: {
        fontSize: 14,
        color: "#555",
        marginLeft: 5,
    },
    actionButton: {
        backgroundColor: "#003DA5",
        paddingVertical: 10,
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
        fontWeight: "500",
    },
    emptyContainer: {
        alignItems: "center",
        paddingTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: "#555",
    },
});

export default BusinessScreen;
