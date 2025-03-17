import { theme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';


// Tipagem para as props do componente Button
interface ButtonProps {
    mode?: 'contained' | 'outlined'; // Mantém o conceito de "mode" para estilização
    style?: any; // Pode ser ajustado para uma tipagem mais específica, como ViewStyle
    children: React.ReactNode; // Para o texto ou conteúdo do botão
    onPress: () => void; // Função de callback para o clique
    disabled?: boolean; // Suporte para desabilitar o botão
}

export default function Button({
    mode = 'contained',
    style,
    children,
    onPress,
    disabled = false,
    ...props
}: ButtonProps) {
    // O Button nativo do React Native não suporta estilização avançada diretamente,
    // então vamos usar um TouchableOpacity para maior controle sobre o estilo
    return (
        <TouchableOpacity
            style={[
                styles.button,
                mode === 'outlined' && { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.primary },
                mode === 'contained' && { backgroundColor: theme.colors.primary },
                disabled && { opacity: 0.5 },
                style,
            ]}
            onPress={onPress}
            disabled={disabled}
            {...props}
        >
            <Text
                style={[
                    styles.text,
                    mode === 'outlined' && { color: theme.colors.primary },
                    mode === 'contained' && { color: theme.colors.surface },
                ]}
            >
                {children}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        marginVertical: 10,
        paddingVertical: 12, // Ajustado para melhor aparência
        borderRadius: 4, // Adicionando bordas arredondadas
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontWeight: 'bold',
        fontSize: 15,
        lineHeight: 26,
    },
});