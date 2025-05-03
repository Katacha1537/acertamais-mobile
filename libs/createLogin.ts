import { auth } from '@/service/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export const createLogin = async (email: string, senha: string) => {
    const password = '123456789'; // Senha padrão gerada para o funcionário
    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        const uid = userCredential.user.uid;
        return uid; // Retorna o UID do usuário criado
    } catch (error) {
        console.error('Erro ao criar o login:', error);
        throw error; // Lança o erro para ser tratado onde a função for chamada
    }
};
