import React from 'react';
import { Image, StyleSheet } from 'react-native';

// Tipagem para as props (opcional, já que não há props atualmente)
interface LogoProps {
    // Pode adicionar props no futuro, se necessário
}

export default function Logo({ }: LogoProps = {}) {
    return (
        <Image
            source={require('../assets/items/logo.png')}
            style={styles.image}
            resizeMode="contain" // Boa prática para imagens como logos
        />
    );
}

const styles = StyleSheet.create({
    image: {
        width: 110,
        height: 110,
        marginBottom: 8,
    },
});