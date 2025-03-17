import { theme } from '@/constants/theme';
import { Eye, EyeOff } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Tipagem para as props do componente TextInput
interface TextInputProps extends React.ComponentProps<typeof TextInput> {
    errorText?: string;
    description?: string;
    label?: string;
    error?: boolean;
}

export default function CustomTextInput({
    errorText,
    description,
    label,
    error = false,
    placeholder,
    placeholderTextColor = theme.colors.secondary,
    secureTextEntry,
    ...props
}: TextInputProps) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const inputRef = useRef<TextInput>(null);

    return (
        <View style={styles.container}>
            {label && <Text style={[styles.label, error && styles.labelError]}>{label}</Text>}
            <TouchableOpacity
                activeOpacity={1}
                style={[styles.inputContainer, error || errorText ? styles.inputContainerError : styles.inputContainerDefault]}
                onPress={() => inputRef.current?.focus()}
            >
                <TextInput
                    ref={inputRef}
                    style={styles.input}
                    onChangeText={props.onChangeText} // Passando onChangeText explicitamente
                    value={props.value} // Passando value explicitamente
                    placeholder={placeholder}
                    placeholderTextColor={placeholderTextColor}
                    selectionColor={theme.colors.primary}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    {...props}
                />
                {secureTextEntry && (
                    <TouchableOpacity
                        style={styles.iconContainer}
                        onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    >
                        {isPasswordVisible ? <EyeOff size={20} color={theme.colors.primary} /> : <Eye size={20} color={theme.colors.primary} />}
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
            {description && !errorText ? (
                <Text style={styles.description}>{description}</Text>
            ) : null}
            {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    inputContainer: {
        width: '100%',
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    inputContainerDefault: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.surface,
    },
    inputContainerError: {
        borderColor: theme.colors.error,
        backgroundColor: theme.colors.surface,
    },
    label: {
        fontSize: 14,
        color: theme.colors.primary,
        marginBottom: 4,
    },
    labelError: {
        color: theme.colors.error,
    },
    input: {
        fontSize: 16,
        height: '100%',
        flex: 1,
    },
    iconContainer: {
        padding: 10,
    },
    description: {
        fontSize: 13,
        color: theme.colors.secondary,
        paddingTop: 8,
    },
    error: {
        fontSize: 13,
        color: theme.colors.error,
        paddingTop: 8,
    },
});
