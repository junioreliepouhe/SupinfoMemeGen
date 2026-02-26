import { initializeApp } from "@firebase/app";
import { initializeFirestore } from "@firebase/firestore";
import { getStorage } from "@firebase/storage";
import { getAuth, GoogleAuthProvider } from "@firebase/auth";

// Configuration Firebase - Master Pro Edition
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim(),
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || "supinfomemegen.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim(),
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim()
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Force le long-polling pour éviter les erreurs RPC et gestion d'erreur Database
let db: any;
try {
    db = initializeFirestore(app, {
        experimentalForceLongPolling: true,
    });
    console.log("✅ [FIRESTORE] Initialisé avec succès sur", firebaseConfig.projectId);
} catch (error: any) {
    if (error.message?.includes('Database') || error.code === 'not-found') {
        console.error("❌ [FIRESTORE] Base de données introuvable ! Vérifiez votre ProjectID dans .env");
    } else if (error.message?.includes('network') || error.code === 'unavailable') {
        console.error("⚠️ [FIRESTORE] Réseau instable. Mode déconnecté Master activé.");
    } else {
        console.error("❌ [FIRESTORE] Erreur Master:", error);
    }
}

export { db };

export const storage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
