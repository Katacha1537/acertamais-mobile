import { theme } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text } from 'react-native';


// Tipagem para as props do componente Header
interface HeaderProps {
    children: React.ReactNode; // Para o texto do cabeçalho
    style?: any; // Pode ser ajustado para uma tipagem mais específica, como TextStyle
}

export default function Header({ children, style, ...props }: HeaderProps) {
    return (
        <Text
            style={[styles.header, style]} // Permite sobrescrever o estilo via props
            {...props}
        >
            {children}
        </Text>
    );
}

const styles = StyleSheet.create({
    header: {
        fontSize: 21,
        color: theme.colors.primary,
        fontWeight: 'bold',
        paddingVertical: 12,
    },
});