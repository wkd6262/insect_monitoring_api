import prisma from '../prisma';
import { Statistics } from '../models/statistics';

export class StatisticsService {
  public async findFirst(): Promise<Statistics | null> {
    const stats: Statistics | null = await prisma.statistics.findFirst({
      orderBy: { id: 'asc' },
    });
    return stats;
  }

  public async create(data: Statistics): Promise<Statistics> {
    const created: Statistics = await prisma.statistics.create({ data });
    return created;
  }

  public async update(id: number, data: Statistics): Promise<Statistics> {
    const updated: Statistics = await prisma.statistics.update({
      where: { id },
      data,
    });
    return updated;
  }
}
