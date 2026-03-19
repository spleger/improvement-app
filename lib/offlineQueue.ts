const DB_NAME = 'transform-offline';
const STORE_NAME = 'write-queue';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function queueWrite(url: string, method: string, body: unknown): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({
        url,
        method,
        body: JSON.stringify(body),
        timestamp: Date.now()
    });
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function processQueue(): Promise<number> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const items: { id: number; url: string; method: string; body: string; timestamp: number }[] =
        await new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

    let processed = 0;
    for (const item of items) {
        try {
            const response = await fetch(item.url, {
                method: item.method,
                headers: { 'Content-Type': 'application/json' },
                body: item.body
            });
            if (response.ok || response.status < 500) {
                // Remove from queue on success or client error (don't retry 4xx)
                const deleteTx = db.transaction(STORE_NAME, 'readwrite');
                deleteTx.objectStore(STORE_NAME).delete(item.id);
                processed++;
            }
        } catch {
            // Network still down, stop processing
            break;
        }
    }
    return processed;
}

export async function getQueueSize(): Promise<number> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    return new Promise((resolve, reject) => {
        const request = tx.objectStore(STORE_NAME).count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}
