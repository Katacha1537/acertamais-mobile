import BackButton from '@/components/BackButton';
import { emailValidator } from '@/libs/emailValidator';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import Background from '../components/Background';
import Button from '../components/Button';
import Header from '../components/Header';
import Logo from '../components/Logo';
import TextInput from '../components/TextInput';

// Tipagem para o estado do email
interface EmailState {
    value: string;
    error: string;
}

export default function ResetPasswordScreen() {
    const [email, setEmail] = useState<EmailState>({ value: '', error: '' });
    const [loading, setLoading] = useState<boolean>(false); // Estado de carregamento
    const router = useRouter();

    const sendResetPasswordEmail = async () => {
        const emailError = emailValidator(email.value);
        if (emailError) {
            setEmail({ ...email, error: emailError });
            return;
        }

        setLoading(true); // Ativa o estado de carregamento
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
            setLoading(false); // Desativa o estado de carregamento
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
            <TextInput
                label="Email"
                returnKeyType="done"
                value={email.value}
                onChangeText={(text: string) => setEmail({ value: text, error: '' })}
                error={!!email.error}
                errorText={email.error}
                autoCapitalize="none"
                textContentType="emailAddress"
                keyboardType="email-address"
                description="Você receberá um email com o link para redefinir sua senha."
            />
            <Button
                mode="contained"
                onPress={sendResetPasswordEmail}
                style={{ marginTop: 16 }}
                disabled={loading} // Desabilita o botão enquanto carrega
            >
                {loading ? 'Carregando...' : 'Continuar'}
            </Button>
        </Background>
    );
}