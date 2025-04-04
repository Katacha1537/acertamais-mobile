import React, { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

interface BackgroundProps {
    children: ReactNode;
}

export default function Background({ children }: BackgroundProps) {
    console.log("Renderizando Background, children presentes:", !!children);

    return (
        <View style={styles.background}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined} // 'height' pode causar problemas no Android
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100} // Ajuste para Android
            >
                {children}
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: '100%',
        backgroundColor: 'white', // Mantém o fundo visível
    },
    container: {
        flex: 1,
        padding: 20,
        width: '100%',
        // Removido maxWidth para evitar restrições desnecessárias
        alignItems: 'center',
        justifyContent: 'center',
    },
});