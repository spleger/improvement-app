export { prisma } from '../prisma';
export { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
export function generateId(): string { return randomUUID(); }
