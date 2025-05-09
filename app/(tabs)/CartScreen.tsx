import { useAuth } from '@/context/AuthContext';
import { db } from '@/service/firebase';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    serverTimestamp,
    updateDoc,
    where,
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CartItem {
    id: string;
    userId: string;
    serviceId: string;
    nome_servico: string;
    descricao: string;
    preco: number;
    credenciado_id: string;
    empresa_nome: string;
    imagemUrl: string;
    quantity: number;
}

interface UserData {
    nome?: string;
    empresaId: string;
    [key: string]: any;
}

export default function CartScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [requesting, setRequesting] = useState<boolean>(false);
    const [userData, setUserData] = useState<UserData | null>(null);

    const fetchCartItems = useCallback(async () => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const q = query(collection(db, 'carts'), where('userId', '==', user.uid));
            const snapshot = await getDocs(q);
            const items: CartItem[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                quantity: doc.data().quantity || 1,
            })) as CartItem[];

            // Fetch user data
            const userDocRef = doc(db, 'funcionarios', user.uid);
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) throw new Error('Usuário não encontrado');
            const data = userDoc.data() as UserData;
            setUserData(data);

            setCartItems(items);
            console.log('Itens do carrinho carregados:', items.length);
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
            Alert.alert('Erro', 'Não foi possível carregar o carrinho.');
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchCartItems();
    }, [fetchCartItems]);

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;

        try {
            const cartRef = doc(db, 'carts', itemId);
            await updateDoc(cartRef, { quantity: newQuantity });
            setCartItems((prev) =>
                prev.map((item) =>
                    item.id === itemId ? { ...item, quantity: newQuantity } : item
                )
            );
            console.log('Quantidade atualizada para item:', itemId, newQuantity);
        } catch (error) {
            console.error('Erro ao atualizar quantidade:', error);
            Alert.alert('Erro', 'Não foi possível atualizar a quantidade.');
        }
    };

    const removeFromCart = async (itemId: string) => {
        try {
            await deleteDoc(doc(db, 'carts', itemId));
            setCartItems((prev) => prev.filter((item) => item.id !== itemId));
            console.log('Item removido do carrinho:', itemId);
        } catch (error) {
            console.error('Erro ao remover item do carrinho:', error);
            Alert.alert('Erro', 'Não foi possível remover o item do carrinho.');
        }
    };

    const handleRequestServices = async () => {
        if (requesting || cartItems.length === 0) return;

        if (!user?.uid) {
            Alert.alert('Faça login para solicitar serviços!');
            router.push('/');
            return;
        }

        setRequesting(true);
        try {
            // Verificar se todos os itens têm o mesmo credenciado_id
            const credenciadoId = cartItems[0]?.credenciado_id;
            const hasDifferentCredenciados = cartItems.some(
                (item) => item.credenciado_id !== credenciadoId
            );

            if (hasDifferentCredenciados) {
                Alert.alert(
                    'Erro',
                    'Todos os serviços no carrinho devem ser do mesmo credenciado para uma única solicitação.'
                );
                setRequesting(false);
                return;
            }

            // Criar a lista de serviços sem o credenciado_id
            const services = cartItems.map((item) => ({
                serviceId: item.serviceId,
                nome_servico: item.nome_servico,
                descricao: item.descricao,
                preco: item.preco,
                quantity: item.quantity,
                total: item.preco * item.quantity,
                empresa_nome: item.empresa_nome,
                imagemUrl: item.imagemUrl,
            }));

            const clienteNome = userData ? userData.nome || 'Cliente' : 'Cliente';

            // Criar a solicitação com o credenciado_id no nível superior
            const solicitacao = {
                clienteId: user.uid,
                clienteNome,
                createdAt: serverTimestamp(),
                services: services,
                total: services.reduce((sum, service) => sum + service.total, 0),
                status: 'pendente',
                allowContact: true,
                credenciado_id: credenciadoId,
            };

            // Salvar a solicitação
            await addDoc(collection(db, 'solicitacoes'), solicitacao);

            // Remover todos os itens do carrinho
            for (const item of cartItems) {
                await deleteDoc(doc(db, 'carts', item.id));
            }

            setCartItems([]);
            Alert.alert('Sucesso', 'Solicitação enviada com sucesso!', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (error) {
            console.error('Erro ao solicitar serviços:', error);
            Alert.alert('Erro', 'Não foi possível enviar a solicitação.');
        } finally {
            setRequesting(false);
        }
    };

    const calculateTotal = () => {
        return cartItems
            .reduce((total, item) => total + item.preco * item.quantity, 0)
            .toFixed(2);
    };

    const renderItem = ({ item }: { item: CartItem }) => (
        <View style={styles.card}>
            <View style={styles.itemDetails}>
                <Text style={styles.title}>{item.nome_servico}</Text>
                <Text style={styles.description} numberOfLines={2}>
                    {item.descricao}
                </Text>
                <Text style={styles.price}>
                    R$ {item.preco.toFixed(2)} x {item.quantity} = R$ {(item.preco * item.quantity).toFixed(2)}
                </Text>
                <Text style={styles.company}>{item.empresa_nome}</Text>
                <View style={styles.quantityContainer}>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                    >
                        <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                        <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromCart(item.id)}
            >
                <FontAwesome name="trash" size={20} color="#FF0000" />
            </TouchableOpacity>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.loading}>
                <ActivityIndicator size="large" color="#003DA5" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Carrinho</Text>
            </View>
            <FlatList
                data={cartItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={<Text style={styles.empty}>Seu carrinho está vazio</Text>}
                contentContainerStyle={[styles.listContent, { paddingBottom: 20 }]}
            />
            {cartItems.length > 0 && (
                <View style={styles.footer}>
                    <Text style={styles.totalText}>Total: R$ {calculateTotal()}</Text>
                    <TouchableOpacity
                        style={[styles.requestButton, requesting && styles.disabled]}
                        onPress={handleRequestServices}
                        disabled={requesting}
                    >
                        <Text style={styles.requestButtonText}>
                            {requesting ? 'Solicitando...' : 'Solicitar Serviços'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
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
        alignItems: 'center',
        padding: 15,
        backgroundColor: '#FFF',
    },
    backButton: {
        padding: 10,
    },
    backText: {
        color: '#003DA5',
        fontSize: 16,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    listContent: {
        padding: 15,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 8,
        marginBottom: 15,
        padding: 10,
        alignItems: 'center',
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 10,
    },
    imagePlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 10,
        backgroundColor: '#EEE',
    },
    itemDetails: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginVertical: 5,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'green',
    },
    company: {
        fontSize: 14,
        color: '#333',
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    quantityButton: {
        backgroundColor: '#007BFF',
        borderRadius: 5,
        padding: 5,
        width: 30,
        alignItems: 'center',
    },
    quantityButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    quantityText: {
        fontSize: 16,
        marginHorizontal: 10,
        color: '#333',
    },
    removeButton: {
        padding: 10,
    },
    footer: {
        padding: 15,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#DDD',
        marginBottom: Platform.OS === 'ios' ? 70 : 0,
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    requestButton: {
        backgroundColor: '#003DA5',
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
    },
    requestButtonText: {
        color: '#FFF',
        fontSize: 16,
    },
    disabled: {
        backgroundColor: '#999',
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