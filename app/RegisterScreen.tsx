import { useAuth } from '@/context/AuthContext';
import { useFirestore } from '@/hooks/useFirestore';
import { auth } from '@/service/firebase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface InputState {
    value: string;
    error: string;
}

export default function RegisterScreen() {
    const [email, setEmail] = useState<InputState>({ value: '', error: '' });
    const [password, setPassword] = useState<InputState>({ value: '', error: '' });
    const [confirmPassword, setConfirmPassword] = useState<InputState>({ value: '', error: '' });
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const { user } = useAuth();
    const router = useRouter();

    const { addDocument: addFuncionario, loading: addLoading } = useFirestore({
        collectionName: 'funcionarios'
    });

    const { addDocument: addUser } = useFirestore({
        collectionName: 'users'
    });

    const createLogin = async (email: string, password: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user.uid;
    };

    const onRegisterPressed = async () => {
        setLoading(true);
        try {
            // Validações
            if (!email.value || !email.value.includes('@')) {
                setEmail({ ...email, error: !email.value ? 'Email não pode ser vazio' : 'Email inválido' });
                setLoading(false);
                return;
            }
            if (!password.value) {
                setPassword({ ...password, error: 'Senha não pode ser vazia' });
                setLoading(false);
                return;
            }
            if (password.value.length < 6) {
                setPassword({ ...password, error: 'A senha deve ter pelo menos 6 caracteres' });
                setLoading(false);
                return;
            }
            if (!confirmPassword.value || confirmPassword.value !== password.value) {
                setConfirmPassword({
                    ...confirmPassword,
                    error: !confirmPassword.value ? 'Confirme a senha' : 'As senhas não coincidem',
                });
                setLoading(false);
                return;
            }

            // Criação do usuário no Firebase Authentication
            const userCreated = await createLogin(email.value, password.value);

            // Salvando informações no Firestore
            const userInfo = {
                uid: userCreated,
                role: 'employee',
                email: email.value,
                firstLogin: true
            };

            await addUser(userInfo, null);

            await addFuncionario({
                id: userCreated,
                companyName: 'Acerta+',
                empresaId: 'LPfBr5BAJlMiDVxdMs0XOvMIKaG2',
                email: email.value,
            }, userCreated);

            // Deslogar o usuário após o registro
            await signOut(auth);

            console.log('Registro bem-sucedido');
            router.replace('/'); // Redirect to login page
        } catch (error: any) {
            console.error('Erro no registro:', error);
            if (error.code === 'auth/email-already-in-use') {
                setEmail({ ...email, error: 'Este email já está em uso' });
            } else if (error.code === 'auth/invalid-email') {
                setEmail({ ...email, error: 'Email inválido' });
            } else {
                setEmail({ ...email, error: 'Erro ao criar conta' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.content}>
                    {/* Logo */}
                    <Text style={styles.logo}>✚</Text>

                    {/* Título */}
                    <Text style={styles.header}>Criar conta</Text>

                    {/* Campo Email */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            placeholder='exemplo@dominio.com'
                            returnKeyType='next'
                            value={email.value}
                            onChangeText={(text) => setEmail({ value: text, error: '' })}
                            autoCapitalize='none'
                            keyboardType='email-address'
                            style={[styles.textInput, email.error ? styles.inputError : null]}
                        />
                        {email.error ? <Text style={styles.errorText}>{email.error}</Text> : null}
                    </View>

                    {/* Campo Senha */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Senha</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                placeholder='*********'
                                returnKeyType='next'
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

                    {/* Campo Confirmar Senha */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirmar Senha</Text>
                        <TextInput
                            placeholder='*********'
                            returnKeyType='done'
                            value={confirmPassword.value}
                            onChangeText={(text) => setConfirmPassword({ value: text, error: '' })}
                            secureTextEntry={!showPassword}
                            style={[styles.textInput, confirmPassword.error ? styles.inputError : null]}
                        />
                        {confirmPassword.error ? <Text style={styles.errorText}>{confirmPassword.error}</Text> : null}
                    </View>

                    {/* Botão Registrar */}
                    <TouchableOpacity
                        style={[styles.button, loading ? styles.buttonDisabled : null]}
                        onPress={onRegisterPressed}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Carregando...' : 'Registrar'}</Text>
                    </TouchableOpacity>

                    {/* Link para voltar ao Login */}
                    <TouchableOpacity
                        style={styles.backToLogin}
                        onPress={() => router.push('/')}
                        disabled={loading}
                    >
                        <Text style={styles.backText}>Já tem conta? Faça login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
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
    button: {
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
    backToLogin: {
        marginTop: 20,
        alignItems: 'center',
    },
    backText: {
        fontSize: 14,
        color: '#0052CC',
    },
});