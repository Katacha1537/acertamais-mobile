import { onAuthStateChanged, User } from 'firebase/auth';
import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '../service/firebase';

// Tipagem para o valor do contexto
interface AuthContextType {
  user: User | null;
}

// Criação do contexto com tipagem (valor inicial como undefined até o Provider ser usado)
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tipagem para as props do AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // Função de cleanup para desinscrever o listener
    return () => unsubscribe();
  }, []);

  // Valor do contexto
  const contextValue: AuthContextType = { user };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o AuthContext (opcional, mas recomendado)
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};