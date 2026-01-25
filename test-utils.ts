
import { NextRequest } from 'next/server';

export function createMockRequest(body: any): NextRequest {
    return {
        json: async () => body,
        formData: async () => {
            const formData = new FormData();
            for (const key in body) {
                formData.append(key, body[key]);
            }
            return formData;
        }
    } as any;
}

export const dbMock = {};
export const startDb = jest.fn();
export const stopDb = jest.fn();
