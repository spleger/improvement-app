import { prisma } from './client';

export async function getUserById(id: string) {
    return await prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
}

export async function createUser(data: {
    email: string;
    passwordHash: string;
    displayName?: string;
}) {
    return await prisma.user.create({
        data: {
            email: data.email,
            passwordHash: data.passwordHash,
            displayName: data.displayName,
        },
    });
}

export async function updateUserAvatar(userId: string, avatarUrl: string | null): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
    });
}
