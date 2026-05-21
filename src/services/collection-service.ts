import prisma from '../prisma';
import { CollectionHistory } from '../models/collectionHistory';

export class CollectionService {
  public async register(data: CollectionHistory): Promise<CollectionHistory> {
    const newData: CollectionHistory = await prisma.collectionHistory.create({
      data,
    });
    return newData;
  }

  public async count() {
    const count: number = await prisma.collectionHistory.count();
    return count;
  }

  public async countByStatus() {
    const [good_count, normal_count, warning_count, bad_count] = await Promise.all([
      prisma.collectionHistory.count({ where: { status: 'good' } }),
      prisma.collectionHistory.count({ where: { status: 'normal' } }),
      prisma.collectionHistory.count({ where: { status: 'warning' } }),
      prisma.collectionHistory.count({ where: { status: 'bad' } }),
    ]);
    return { good_count, normal_count, warning_count, bad_count };
  }

  public async findById(id: number): Promise<CollectionHistory | null> {
    const history: CollectionHistory | null =
      await prisma.collectionHistory.findUnique({
        where: { id },
      });
    return history;
  }

  public async find(page: number, count: number): Promise<CollectionHistory[]> {
    const list: CollectionHistory[] = await prisma.collectionHistory.findMany({
      orderBy: { created_date: 'desc' },
      skip: (page - 1) * count,
      take: count,
    });
    return list;
  }

  public async findMapList(
    addressSido: string,
    addressGungu: string,
    addressDong: string,
  ): Promise<CollectionHistory[]> {
    const where: {
      address_sido?: string;
      address_gungu?: string;
      address_dong?: string;
    } = {};

    if (addressSido) where.address_sido = addressSido;
    if (addressGungu) where.address_gungu = addressGungu;
    if (addressDong) where.address_dong = addressDong;

    const list: CollectionHistory[] = await prisma.collectionHistory.findMany({
      where,
      orderBy: { created_date: 'desc' },
    });
    return list;
  }

  public async update(
    id: number,
    data: CollectionHistory,
  ): Promise<CollectionHistory | null> {
    const newData: CollectionHistory | null = await prisma.collectionHistory.update({
      where: { id },
      data,
    });
    return newData;
  }

  public async delete(id: number) {
    const deleteData = prisma.collectionHistory.delete({
      where: { id },
    });
    return deleteData;
  }
}
