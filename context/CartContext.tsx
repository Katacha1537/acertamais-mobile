import { db } from '@/service/firebase';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
}

interface CartContextType {
    isCartOpen: boolean;
    toggleCart: () => void;
    cartItems: CartItem[];
    fetchCartItems: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const { user } = useAuth();

    const toggleCart = () => {
        setIsCartOpen((prev) => !prev);
    };

    const fetchCartItems = useCallback(async () => {
        if (!user?.uid) {
            setCartItems([]);
            return;
        }

        try {
            const q = query(collection(db, 'carts'), where('userId', '==', user.uid));
            const snapshot = await getDocs(q);
            const items: CartItem[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as CartItem[];
            setCartItems(items);
            console.log('Itens do carrinho carregados:', items.length);
        } catch (error) {
            console.error('Erro ao carregar carrinho:', error);
        }
    }, [user?.uid]);

    useEffect(() => {
        fetchCartItems();
    }, [fetchCartItems]);

    return (
        <CartContext.Provider value={{ isCartOpen, toggleCart, cartItems, fetchCartItems }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};