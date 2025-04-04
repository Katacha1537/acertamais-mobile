import BackButton from '@/components/BackButton';
import { emailValidator } from '@/libs/emailValidator';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, TextInput as RNTextInput, StyleSheet, Text } from 'react-native';
import Background from '../components/Background';
import Button from '../components/Button';
import Header from '../components/Header';
import Logo from '../components/Logo';

interface EmailState {
    value: string;
    error: string;
}

export default function ResetPasswordScreen() {
    const [email, setEmail] = useState<EmailState>({ value: '', error: '' });
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();

    const sendResetPasswordEmail = async () => {
        const emailError = emailValidator(email.value);
        if (emailError) {
            setEmail({ ...email, error: emailError });
            return;
        }

        setLoading(true);
        try {
            console.log(email.value);
            const response = await fetch('https://acertamais.vercel.app/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.value }),
            });

            const textResponse = await response.text();
            let errorData: { error?: string } = {};

            if (textResponse) {
                try {
                    errorData = JSON.parse(textResponse);
                } catch (jsonError) {
                    console.error('Erro ao parsear JSON:', jsonError);
                    throw new Error('Resposta inválida do servidor.');
                }
            }

            if (!response.ok) {
                throw new Error(
                    errorData.error || `Erro ao enviar o email de recuperação (código ${response.status}).`
                );
            }

            Alert.alert(
                'Sucesso',
                'Email de recuperação enviado com sucesso para sua caixa de entrada.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/'),
                    },
                ]
            );
        } catch (error) {
            console.error('Erro:', (error as Error).message);
            setEmail({ ...email, error: (error as Error).message });
        } finally {
            setLoading(false);
        }
    };

    const handlePress = () => {
        router.replace('/');
    };

    return (
        <Background>
            <BackButton goBack={handlePress} />
            <Logo />
            <Header>Redefinir sua senha.</Header>
            <RNTextInput
                style={styles.input}
                placeholder="Email"
                returnKeyType="done"
                value={email.value}
                onChangeText={(text: string) => setEmail({ value: text, error: '' })}
                autoCapitalize="none"
                textContentType="emailAddress"
                keyboardType="email-address"
            />
            {email.error ? <Text style={styles.error}>{email.error}</Text> : null}
            <Text style={styles.description}>
                Você receberá um email com o link para redefinir sua senha.
            </Text>
            <Button
                mode="contained"
                onPress={sendResetPasswordEmail}
                style={{ marginTop: 16 }}
                disabled={loading}
            >
                {loading ? 'Carregando...' : 'Continuar'}
            </Button>
        </Background>
    );
}

const styles = StyleSheet.create({
    input: {
        width: '100%',
        height: 48,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        paddingHorizontal: 10,
        marginVertical: 10,
        backgroundColor: '#fff',
    },
    error: {
        color: 'red',
        fontSize: 12,
        marginBottom: 10,
    },
    description: {
        fontSize: 12,
        color: '#666',
        marginBottom: 10,
    },
});