import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, signInAnonymously, User } from '@firebase/auth';

interface AuthContextType {
    user: User | null;
    isGuest: boolean;
    guestName: string;
    loading: boolean;
    loginWithGoogle: () => Promise<void>;
    loginAsGuest: (name: string) => void;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Restaurer la session Invité
        const savedGuest = localStorage.getItem('meme_master_guest');
        if (savedGuest) {
            setIsGuest(true);
            setGuestName(savedGuest);
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser: any) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setIsGuest(false);
            } else if (!savedGuest) {
                // Auto-login invité par défaut si rien n'est trouvé
                const prefixes = ['Ghost', 'Shadow', 'Neon', 'Cyber', 'Master', 'Elite'];
                const suffix = Math.floor(Math.random() * 9999);
                const defaultName = `${prefixes[Math.floor(Math.random() * prefixes.length)]}_${suffix}`;
                setIsGuest(true);
                setGuestName(defaultName);
                localStorage.setItem('meme_master_guest', defaultName);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        setLoading(true);
        try {
            // Tentative de connexion directe Google
            const result = await signInWithPopup(auth, googleProvider);
            if (result.user) {
                setUser(result.user);
                setIsGuest(false);
                localStorage.removeItem('meme_master_guest');
            }
        } catch (error: any) {
            console.warn("⚠️ Google Auth Interrompu ou Bloqué:", error);
            // On ne bascule en anonyme QUE si c'est une erreur réelle (pas une annulation utilisateur)
            if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
                return;
            }

            try {
                await signInAnonymously(auth);
            } catch (anonError) {
                console.error("❌ Échec critique de l'Auth Anonyme:", anonError);
            }
        } finally {
            setLoading(false);
        }
    };

    const loginAsGuest = (name: string) => {
        setIsGuest(true);
        setGuestName(name);
        localStorage.setItem('meme_master_guest', name);
    };

    const logout = async () => {
        await signOut(auth);
        setUser(null);
        setIsGuest(false);
        setGuestName('');
        localStorage.removeItem('meme_master_guest');
    };

    return (
        <AuthContext.Provider value={{ user, isGuest, guestName, loading, loginWithGoogle, loginAsGuest, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};
