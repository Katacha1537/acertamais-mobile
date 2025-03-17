import Background from '@/components/Background';
import Button from '@/components/Button';
import Header from '@/components/Header';
import Logo from '@/components/Logo';
import TextInput from '@/components/TextInput';
import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/service/firebase';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../constants/theme';

// Tipagem para os estados de CPF e Senha
interface InputState {
    value: string;
    error: string;
}

// Tipagem para os dados do usuário do Firebase
interface UserData {
    email: string;
    role: string;
    [key: string]: any;
}

// Função para aplicar a máscara no CPF
const maskCPF = (value: string): string => {
    return value
        .replace(/\D/g, '') // Remove tudo o que não for número
        .replace(/^(\d{3})(\d)/, '$1.$2') // Adiciona o primeiro ponto
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3') // Adiciona o segundo ponto
        .replace(/\.(\d{3})(\d)/, '.$1-$2') // Adiciona o hífen
        .replace(/-(\d{2})\d+$/, '-$1'); // Limita a quantidade de dígitos após o hífen
};

// Função para validar o CPF (simplificada, pode ser substituída por uma biblioteca)
const isValidCPF = (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.length === 11; // Validação básica, recomenda-se uma biblioteca para validação completa
};

export default function LoginScreen() {
    const [cpf, setCpf] = useState<InputState>({ value: '', error: '' });
    const [password, setPassword] = useState<InputState>({ value: '', error: '' });
    const [showPassword, setShowPassword] = useState<boolean>(false); // Controle para mostrar/ocultar senha
    const [loading, setLoading] = useState<boolean>(false); // Estado de carregamento
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.replace('/(tabs)');
        }
    }, [user, router]);

    const onLoginPressed = async () => {
        setLoading(true); // Ativa o estado de carregamento
        try {
            // Validação dos campos CPF e Senha
            if (!cpf.value) {
                setCpf({ ...cpf, error: 'CPF não pode ser vazio' });
                setLoading(false);
                return;
            }

            if (!isValidCPF(cpf.value)) {
                setCpf({ ...cpf, error: 'CPF inválido' });
                setLoading(false);
                return;
            }

            if (!password.value) {
                setPassword({ ...password, error: 'Senha não pode ser vazia' });
                setLoading(false);
                return;
            }

            // Consulta a coleção "funcionarios" no Firestore
            const funcionariosRef = collection(db, 'funcionarios');
            const q = query(funcionariosRef, where('cpf', '==', cpf.value));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setCpf({ ...cpf, error: 'CPF não encontrado' });
                setLoading(false);
                return;
            }

            const funcionario = querySnapshot.docs[0].data() as { email: string };
            const userRef = collection(db, 'users');
            const qUser = query(userRef, where('email', '==', funcionario.email));
            const querySnapshotUser = await getDocs(qUser);

            if (querySnapshotUser.empty) {
                setCpf({ ...cpf, error: 'Usuário associado ao CPF não encontrado' });
                setLoading(false);
                return;
            }

            const userInfo = querySnapshotUser.docs[0].data() as UserData;
            console.log(userInfo);

            // Verifica se o usuário tem o papel (role) "employee"
            if (userInfo.role !== 'employee') {
                setCpf({ ...cpf, error: 'Permissão negada' });
                setLoading(false);
                return;
            }

            // Autentica o usuário no Firebase Auth
            await signInWithEmailAndPassword(auth, funcionario.email, password.value);

            // Redireciona para a navegação de tabs após login
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/wrong-password') {
                setPassword({ ...password, error: 'Senha incorreta' });
            } else if (error.code === 'auth/user-not-found') {
                setCpf({ ...cpf, error: 'Usuário não encontrado' });
            } else {
                setCpf({ ...cpf, error: 'Erro ao tentar acessar a conta' });
            }
        } finally {
            setLoading(false); // Desativa o estado de carregamento
        }
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <Background>
                <Logo />
                <Header>Acessar conta</Header>

                {/* Campo CPF com máscara */}
                <TextInput
                    label="CPF"
                    placeholder="***.***.***-**"
                    returnKeyType="next"
                    value={cpf.value}
                    onChangeText={(text) => setCpf({ value: maskCPF(text), error: '' })}
                    error={!!cpf.error}
                    errorText={cpf.error}
                    autoCapitalize="none"
                    keyboardType="number-pad"
                    style={styles.textInput}
                />

                {/* Campo Senha */}
                <TextInput
                    label="Senha"
                    placeholder="*********"
                    returnKeyType="done"
                    value={password.value}
                    onChangeText={(text) => setPassword({ value: text, error: '' })}
                    error={!!password.error}
                    errorText={password.error}
                    secureTextEntry={!showPassword}
                    style={styles.textInput}
                />

                <View style={styles.forgotPassword}>
                    <TouchableOpacity onPress={() => router.push('/ResetPasswordScreen')}>
                        <Text style={styles.forgot}>Esqueceu sua senha?</Text>
                    </TouchableOpacity>
                </View>

                <Button
                    mode="contained"
                    onPress={onLoginPressed}
                    disabled={loading} // Desabilita o botão enquanto carrega
                >
                    {loading ? 'Carregando...' : 'Entrar'}
                </Button>
            </Background>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    forgotPassword: {
        width: '100%',
        alignItems: 'flex-end',
        marginBottom: 10,
    },
    forgot: {
        fontSize: 13,
        color: theme.colors.secondary,
        marginTop: 5,
    },
    textInput: {
        marginBottom: 6,
    },
});