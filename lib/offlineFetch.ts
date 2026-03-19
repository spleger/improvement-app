import { queueWrite } from './offlineQueue';

export async function offlineFetch(url: string, options: RequestInit): Promise<Response> {
    try {
        const response = await fetch(url, options);
        return response;
    } catch (error) {
        // Network error - queue the write if it's a mutation
        const method = options.method?.toUpperCase() || 'GET';
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && options.body) {
            await queueWrite(url, method, JSON.parse(options.body as string));
            // Return a synthetic response so the UI can show optimistic state
            return new Response(JSON.stringify({ success: true, offline: true }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }
        throw error;
    }
}
