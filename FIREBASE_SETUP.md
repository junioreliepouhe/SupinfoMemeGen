# Configuration Firebase pour MEMEMASTER PRO

## 1. Tes clés Firebase (.env)
J'ai déjà créé le fichier **[.env](file:///e:/techminute/SupinfoMemeGen/.env)** à la racine du projet. 
Remplace les valeurs génériques par tes vraies clés (trouvées dans la Console Firebase -> Paramètres du projet -> Application Web).

```env
VITE_FIREBASE_API_KEY=TaCléIci
VITE_FIREBASE_AUTH_DOMAIN=TonDomaine.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=TonIDDeProjet
VITE_FIREBASE_STORAGE_BUCKET=TonBucket.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=TonSenderID
VITE_FIREBASE_APP_ID=TonAppID
```

---

## 2. RÉSOUDRE L'ERREUR CORS (Publication) 🚨
L'erreur "CORS policy blocked access" arrive car Google bloque l'envoi d'images depuis `localhost` par défaut. 
**Voici la méthode la plus simple pour corriger ça (sans rien installer) :**

1. Ouvre la [Console Google Cloud](https://console.cloud.google.com/) et choisis ton projet Firebase.
2. Clique sur l'icône **Cloud Shell** en haut à droite (un petit logo `>_`).
3. Une barre s'ouvre en bas. Clique sur "Ouvrir l'éditeur" (Open Editor).
4. Crée un nouveau fichier nommé `cors.json` et colle ce code dedans :
   ```json
   [
     {
       "origin": ["*"],
       "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
       "responseHeader": ["Content-Type", "Authorization", "x-goog-resumable"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
5. Reviens sur le Terminal du Cloud Shell et tape cette commande (remplace `TON_BUCKET` par ton bucket, ex: `supinfomemegen.appspot.com`) :
   ```bash
   gsutil cors set cors.json gs://TON_BUCKET
   ```
6. **C'est fini !** Le bouton "Publier" fonctionnera immédiatement sur ton PC.

---

## 3. Paramètres Firestore
Vérifie que tes **Règles Firestore** autorisent l'écriture :
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // Pour les tests uniquement
    }
  }
}
```
