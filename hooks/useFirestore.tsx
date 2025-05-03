import { db } from '@/service/firebase';
import { addDoc, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';

interface UseFirestoreOptions {
  collectionName: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useFirestore<T extends { [key: string]: any }>({
  collectionName,
  onSuccess,
  onError
}: UseFirestoreOptions) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Função para adicionar um documento
  const addDocument = async (data: T, userId: string | null) => {
    setLoading(true);
    try {
      if (userId) {
        // Se um userId for passado, usar setDoc para definir o ID do documento
        const docRef = doc(db, collectionName, userId);
        await setDoc(docRef, data);
      } else {
        // Se nenhum userId for passado, usar addDoc para gerar um ID automaticamente
        await addDoc(collection(db, collectionName), data);
      }

      if (onSuccess) onSuccess();
      setLoading(false);
    } catch (err) {
      setError('Erro ao adicionar documento.');
      if (onError) onError(err);
      setLoading(false);
    }
  };

  // Função para atualizar um documento
  const updateDocument = async (id: string, data: T) => {
    setLoading(true);
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, data);

      if (onSuccess) onSuccess();
      setLoading(false);
    } catch (err) {
      setError('Erro ao atualizar documento.');
      if (onError) onError(err);
      setLoading(false);
    }
  };

  return {
    addDocument,
    updateDocument, // Agora também retornamos a função updateDocument
    loading,
    error
  };
}
