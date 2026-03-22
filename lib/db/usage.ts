import { prisma } from './client';

export async function getApiUsageTotals(userId: string) {
    const [total, last7Days] = await Promise.all([
        prisma.apiUsage.aggregate({
            where: { userId },
            _sum: { costCents: true },
            _count: true,
        }),
        prisma.apiUsage.aggregate({
            where: {
                userId,
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
            },
            _sum: { costCents: true },
            _count: true,
        }),
    ]);

    return {
        totalCostCents: total._sum.costCents || 0,
        totalRequests: total._count,
        last7DaysCostCents: last7Days._sum.costCents || 0,
        last7DaysRequests: last7Days._count,
    };
}
