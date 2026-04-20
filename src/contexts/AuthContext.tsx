import React, { createContext, useContext, useState } from 'react';
import { UserProfile } from '../types';

const GUEST_ID = "local-guest-admin";

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Acesso direto imediato. Sem carregamento, sem chamadas de rede.
  const [user] = useState<any>({
    uid: GUEST_ID,
    email: 'admin@fintax.local',
    displayName: 'Investidor (Modo Pessoal)',
    photoURL: 'https://ui-avatars.com/api/?name=Investidor&background=10b981&color=fff'
  });
  
  const [profile] = useState<UserProfile>({
    uid: GUEST_ID,
    email: 'admin@fintax.local',
    displayName: 'Investidor (Modo Pessoal)'
  });

  const signIn = async () => {};
  const logout = async () => {};

  return (
    <AuthContext.Provider value={{ user, profile, loading: false, signIn, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
