import React from 'react';
import { Image, StyleSheet, TouchableOpacity } from 'react-native';

// Tipagem para as props do componente
interface BackButtonProps {
    goBack: () => void;
}

export default function BackButton({ goBack }: BackButtonProps) {
    return (
        <TouchableOpacity onPress={goBack} style={styles.container}>
            <Image style={styles.image} source={require('../assets/items/back.png')} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 10,
    },
    image: {
        width: 24,
        height: 24,
    },
});