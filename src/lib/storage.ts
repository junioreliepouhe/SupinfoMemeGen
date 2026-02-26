export const storeImage = async (key: string, base64: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MemeMasterDB', 1);
        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images');
            }
        };
        request.onsuccess = (event: any) => {
            const db = event.target.result;
            const transaction = db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            store.put(base64, key);
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
    });
};

export const getImage = async (key: string): Promise<string | null> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MemeMasterDB', 1);
        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('images')) {
                db.createObjectStore('images');
            }
        };
        request.onsuccess = (event: any) => {
            const db = event.target.result;
            const transaction = db.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const getReq = store.get(key);
            getReq.onsuccess = () => resolve(getReq.result);
            getReq.onerror = () => reject(getReq.error);
        };
        request.onerror = () => reject(request.error);
    });
};

export const clearImages = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MemeMasterDB', 1);
        request.onsuccess = (event: any) => {
            const db = event.target.result;
            const transaction = db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            store.clear();
            transaction.oncomplete = () => resolve();
        };
        request.onerror = () => reject(request.error);
    });
};
