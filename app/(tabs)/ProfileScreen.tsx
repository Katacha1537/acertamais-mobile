import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, DocumentSnapshot, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../service/firebase";

interface UserData {
    nome?: string;
    cpf?: string;
    dataNascimento?: string;
    email?: string;
    telefone?: string;
    pessoasNaCasa?: string;
    endereco?: string;
}


export default function ProfileScreen() {
    const { user } = useAuth();;
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const router = useRouter();
    useEffect(() => {
        if (!user) {
            router.push({
                pathname: '/'
            })
            return;
        }

        const fetchUserData = async () => {
            try {
                const userDocRef = doc(db, "funcionarios", user.uid);
                const userDoc: DocumentSnapshot = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    setUserData(userDoc.data() as UserData);
                } else {
                    console.error("Usuário não encontrado no Firestore.");
                }
            } catch (error) {
                console.error("Erro ao buscar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user]);

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#003da5" />
                <Text style={styles.loadingText}>Carregando...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Cabeçalho com fundo azul */}
            <View style={styles.header}>
                <Text style={styles.userName}>{userData?.nome || "Usuário"}</Text>
                <Text style={styles.userCpf}>{userData?.cpf || "CPF não disponível"}</Text>
            </View>

            {/* Informações do usuário */}
            <View style={styles.content}>
                <View style={styles.infoCard}>
                    {/* Data de Nascimento */}
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={20} color="#003da5" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Data de Nascimento:</Text>
                            <Text style={styles.infoText}>{userData?.dataNascimento || "Não disponível"}</Text>
                        </View>
                    </View>

                    {/* E-mail */}
                    <View style={styles.infoRow}>
                        <Ionicons name="mail" size={20} color="#003da5" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>E-mail:</Text>
                            <Text style={styles.infoText}>{userData?.email || "Não disponível"}</Text>
                        </View>
                    </View>

                    {/* Telefone */}
                    <View style={styles.infoRow}>
                        <Ionicons name="call" size={20} color="#003da5" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Telefone:</Text>
                            <Text style={styles.infoText}>{userData?.telefone || "Não disponível"}</Text>
                        </View>
                    </View>

                    {/* Pessoas em Casa */}
                    <View style={styles.infoRow}>
                        <Ionicons name="people" size={20} color="#003da5" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Pessoas em Casa:</Text>
                            <Text style={styles.infoText}>{userData?.pessoasNaCasa || "Não disponível"}</Text>
                        </View>
                    </View>

                    {/* Endereço */}
                    <View style={styles.infoRow}>
                        <Ionicons name="location" size={20} color="#003da5" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Endereço:</Text>
                            <Text style={styles.infoText}>{userData?.endereco || "Não disponível"}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F4F7FC",
    },
    loadingText: {
        fontSize: 18,
        color: "#003da5",
        marginTop: 10,
        fontWeight: "500",
    },
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    header: {
        backgroundColor: "#003da5",
        paddingVertical: 40,
        paddingTop: 80,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    userName: {
        fontSize: 28,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 5,
    },
    userCpf: {
        fontSize: 16,
        color: "#fff",
        opacity: 0.9,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    infoCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "flex-start", // Alinha os itens ao topo
        marginBottom: 20,
    },
    infoTextContainer: {
        marginLeft: 10,
        flex: 1, // Ocupa o espaço restante
    },
    infoLabel: {
        fontSize: 14,
        color: "#888",
        marginBottom: 5, // Espaço entre o rótulo e a informação
    },
    infoText: {
        fontSize: 16,
        color: "#333",
    },
    buttonContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 30,
    },
    button: {
        backgroundColor: "#003da5",
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 15,
        alignItems: "center",
        flex: 1,
        marginHorizontal: 5,
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});
