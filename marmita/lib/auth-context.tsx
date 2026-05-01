'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  GoogleAuthProvider,
  User,
} from 'firebase/auth';
import { auth } from './firebase';
import { seedIfEmpty } from './firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  signOutUser: async () => {},
});

const provider = new GoogleAuthProvider();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Captura resultado após redirect do Google (mobile/popup bloqueado)
    getRedirectResult(auth).catch((err) => {
      console.error('getRedirectResult error:', err);
      setAuthError('Erro ao processar login. Tente novamente.');
    });

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        await seedIfEmpty(u.uid);
      }
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      // Popup bloqueado ou fechado → redireciona (mais compatível em mobile)
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, provider);
        return;
      }
      const messages: Record<string, string> = {
        'auth/unauthorized-domain': 'Domínio não autorizado no Firebase. Verifique as configurações.',
        'auth/operation-not-allowed': 'Login com Google não está habilitado no Firebase.',
        'auth/network-request-failed': 'Falha de conexão. Verifique sua internet.',
      };
      setAuthError(messages[code] ?? 'Erro ao entrar com Google. Tente novamente.');
      throw err;
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
