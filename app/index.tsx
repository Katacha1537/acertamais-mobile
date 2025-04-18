import { useAuth } from '@/context/AuthContext';
import { auth, db } from '@/service/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface InputState {
    value: string;
    error: string;
}

interface UserData {
    email: string;
    role: string;
    status?: string; // Adicionado para verificar o status
    [key: string]: any;
}

const maskCPF = (value: string): string => {
    return value
        .replace(/\D/g, '')
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1-$2')
        .replace(/-(\d{2})\d+$/, '-$1');
};

const isValidCPF = (cpf: string): boolean => {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.length === 11;
};

export default function LoginScreen() {
    const [cpf, setCpf] = useState<InputState>({ value: '', error: '' });
    const [password, setPassword] = useState<InputState>({ value: '', error: '' });
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        console.log('useEffect disparado, user:', user);
        if (user) {
            console.log('Redirecionando para /(tabs)');
            router.replace('/(tabs)');
        }
    }, [user, router]);

    const onLoginPressed = async () => {
        console.log('onLoginPressed chamado');
        setLoading(true);
        try {
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

            const funcionariosRef = collection(db, 'funcionarios');
            const q = query(funcionariosRef, where('cpf', '==', cpf.value));
            const querySnapshot = await getDocs(q);
            console.log('Query funcionários:', querySnapshot.docs.length);

            if (querySnapshot.empty) {
                setCpf({ ...cpf, error: 'CPF não encontrado' });
                setLoading(false);
                return;
            }

            const funcionario = querySnapshot.docs[0].data() as { email: string; status?: string };

            // Verificar se o status é 'disabled'
            if (funcionario.status === 'disabled') {
                setCpf({ ...cpf, error: 'Esta conta foi desativada. Entre em contato com o suporte.' });
                setLoading(false);
                return;
            }

            const userRef = collection(db, 'users');
            const qUser = query(userRef, where('email', '==', funcionario.email));
            const querySnapshotUser = await getDocs(qUser);
            console.log('Query users:', querySnapshotUser.docs.length);

            if (querySnapshotUser.empty) {
                setCpf({ ...cpf, error: 'Usuário associado ao CPF não encontrado' });
                setLoading(false);
                return;
            }

            const userInfo = querySnapshotUser.docs[0].data() as UserData;
            console.log('User info:', userInfo);

            if (userInfo.role !== 'employee') {
                setCpf({ ...cpf, error: 'Permissão negada' });
                setLoading(false);
                return;
            }

            await signInWithEmailAndPassword(auth, funcionario.email, password.value);
            console.log('Login bem-sucedido');
            router.replace('/(tabs)');
        } catch (error: any) {
            console.error('Erro no login:', error);
            if (error.code === 'auth/wrong-password') {
                setPassword({ ...password, error: 'Senha incorreta' });
            } else if (error.code === 'auth/user-not-found') {
                setCpf({ ...cpf, error: 'Usuário não encontrado' });
            } else {
                setCpf({ ...cpf, error: 'Erro ao tentar acessar a conta' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Logo */}
                <Text style={styles.logo}>✚</Text>

                {/* Título */}
                <Text style={styles.header}>Acessar conta</Text>

                {/* Campo CPF */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>CPF</Text>
                    <TextInput
                        placeholder='***.***.***-**'
                        returnKeyType='next'
                        value={cpf.value}
                        onChangeText={(text) => setCpf({ value: maskCPF(text), error: '' })}
                        autoCapitalize='none'
                        keyboardType='number-pad'
                        style={[styles.textInput, cpf.error ? styles.inputError : null]}
                    />
                    {cpf.error ? <Text style={styles.errorText}>{cpf.error}</Text> : null}
                </View>

                {/* Campo Senha */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Senha</Text>
                    <View style={styles.passwordContainer}>
                        <TextInput
                            placeholder='*********'
                            returnKeyType='done'
                            value={password.value}
                            onChangeText={(text) => setPassword({ value: text, error: '' })}
                            secureTextEntry={!showPassword}
                            style={[styles.textInput, styles.passwordInput, password.error ? styles.inputError : null]}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword(!showPassword)}
                            style={styles.eyeIcon}
                        >
                            {showPassword ? (
                                <Ionicons name='eye-outline' size={24} color='gray' />
                            ) : (
                                <Ionicons name='eye-off-outline' size={24} color='gray' />
                            )}
                        </TouchableOpacity>
                    </View>
                    {password.error ? <Text style={styles.errorText}>{password.error}</Text> : null}
                </View>

                {/* Link "Esqueceu sua senha?" */}
                <View style={styles.forgotPassword}>
                    <TouchableOpacity onPress={() => router.push('/ResetPasswordScreen')}>
                        <Text style={styles.forgot}>Esqueceu sua senha?</Text>
                    </TouchableOpacity>
                </View>

                {/* Botão Entrar */}
                <TouchableOpacity
                    style={[styles.button, loading ? styles.buttonDisabled : null]}
                    onPress={onLoginPressed}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>{loading ? 'Carregando...' : 'Entrar'}</Text>
                </TouchableOpacity>

                {/* <TouchableOpacity
                    style={styles.buttonDisabled}
                    onPress={() => router.push('/RegisterScreen')}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>Registra-se</Text>
                </TouchableOpacity> */}

                {/* Links para Termos de Uso e Política de Privacidade */}
                {/* <View style={styles.termsContainer}>
                    <TouchableOpacity onPress={() => Linking.openURL('https://seusite.com/termos-de-uso')}>
                        <Text style={styles.termsLink}>Termos de Uso</Text>
                    </TouchableOpacity>
                    <Text style={styles.termsSeparator}> | </Text>
                    <TouchableOpacity onPress={() => Linking.openURL('https://seusite.com/politica-de-privacidade')}>
                        <Text style={styles.termsLink}>Política de Privacidade</Text>
                    </TouchableOpacity>
                </View> */}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 40,
        justifyContent: 'center',
    },
    logo: {
        fontSize: 50,
        color: '#0052CC',
        textAlign: 'center',
        marginBottom: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0052CC',
        textAlign: 'center',
        marginBottom: 40,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    passwordInput: {
        flex: 1,
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
    },
    inputError: {
        borderColor: 'red',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
    },
    forgotPassword: {
        alignItems: 'flex-end',
        marginBottom: 20,
    },
    forgot: {
        fontSize: 14,
        color: '#0052CC',
    },
    button: {
        backgroundColor: '#0052CC',
        paddingVertical: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonRegister: {
        backgroundColor: '#0052CC',
        paddingVertical: 15,
        borderRadius: 5,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#aaa',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    termsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    termsLink: {
        fontSize: 14,
        color: '#0052CC',
        textDecorationLine: 'underline',
    },
    termsSeparator: {
        fontSize: 14,
        color: '#666',
        marginHorizontal: 5,
    },
});