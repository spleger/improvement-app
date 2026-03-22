export interface SSEEvent {
    text?: string;
    error?: string;
    stage?: string;
    done?: boolean;
    [key: string]: unknown;
}

/**
 * Async generator that parses a Server-Sent Events stream into typed events.
 * Handles TextDecoder buffering, line splitting, and [DONE] detection.
 */
export async function* parseSSEStream(
    reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<SSEEvent> {
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);

                if (data === '[DONE]') {
                    yield { done: true };
                    continue;
                }

                try {
                    yield JSON.parse(data) as SSEEvent;
                } catch {
                    // Ignore malformed chunks
                }
            }
        }
    }
}
