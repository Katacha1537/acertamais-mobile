import React, { createContext, useContext, useEffect, useState } from 'react';

interface IsOkContextType {
    isOk: boolean | null;
}

const IsOkContext = createContext<IsOkContextType | undefined>(undefined);

export const IsOkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isOk, setIsOk] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('https://webhook.zapflow.click/webhook/7679d554-4c70-42e2-99a5-659b826e6781');
                const data = await res.json();
                setIsOk(data.ok);
            } catch (error) {
                console.error('Erro ao buscar status:', error);
                setIsOk(false);
            }
        };

        fetchStatus();
    }, []);

    return (
        <IsOkContext.Provider value={{ isOk }}>
            {children}
        </IsOkContext.Provider>
    );
};

export const useIsOk = () => {
    const context = useContext(IsOkContext);
    if (!context) {
        throw new Error('useIsOk must be used within an IsOkProvider');
    }
    return context;
};