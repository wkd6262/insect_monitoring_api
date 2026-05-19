import prisma from '../prisma';
import { InsectHistory } from '../models/insectHistory';

export class CollectionService {
  public async register(data: InsectHistory): Promise<InsectHistory> {
      const newData: InsectHistory = await prisma.insectHistory.create({data: {...data, device: undefined}});
      return newData;
  }
  
  public async count() {
      const count: number = await prisma.insectHistory.count();
      return count;
  }

  public async findByDate(startDate: Date, endDate: Date, deviceIds: number[]): Promise<InsectHistory[]> {
    const list: InsectHistory[] = await prisma.insectHistory.findMany({
      where: {
        created_date: {
          gte: startDate,
          lte: endDate
        },
        device_id: {
          in: deviceIds
        }
      },
      orderBy: {
        created_date: 'desc'
      }
    });
    return list;
  }

  public async find(page: number, count: number): Promise<InsectHistory[]> {
      const list: InsectHistory[] = await prisma.insectHistory.findMany({
          orderBy: {
              created_date: 'desc'
          },
          skip: (page - 1) * count,
          take: count
      });
      return list;
  }

public async findCountOneHourAgo(deviceId: number): Promise<InsectHistory | null> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const history = await prisma.insectHistory.findFirst({
      where: {
        device_id: deviceId,
        created_date: {
          lte: oneHourAgo
        }
      },
      orderBy: {
        created_date: 'desc'
      }
    });
    
    return history;
  }

  public async findWithDeviceByDateRange(startDate: Date, endDate: Date): Promise<InsectHistory[]> {
    const list: InsectHistory[] = await prisma.insectHistory.findMany({
      where: {
        created_date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        device: true
      },
      orderBy: {
        created_date: 'asc'
      }
    });
    return list;
  }
  
  public async update(id: number, data: InsectHistory): Promise<InsectHistory | null> {
      const newData: InsectHistory | null  = await prisma.insectHistory.update({
          where: {
              id: id
          },
          data: {
            ...data,
            device: undefined
          }
      });
      return newData;
  }

  public async updateCount(id: number, historyCount: number): Promise<InsectHistory | null> {
    const updated: InsectHistory = await prisma.insectHistory.update({
      where: { id },
      data: { count: historyCount },
    });
    return updated;
  }

  public async updateManyCountByDateRange(
    startDate: Date,
    endDate: Date,
    historyCount: number,
    deviceUuid?: string
  ) {
    return prisma.insectHistory.updateMany({
      where: {
        created_date: { gte: startDate, lte: endDate },
        ...(deviceUuid ? { device_uuid: deviceUuid } : {}),
      },
      data: { count: historyCount },
    });
  }

  public async updateDeviceUuidByDeviceId(deviceId: number, newDeviceUuid: string) {
    const updateData = prisma.insectHistory.updateMany({
        where: {
            device_id: deviceId
        },
        data: {
            device_uuid: newDeviceUuid
        }
    });
    return updateData;
  }

  public async deleteByDeviceUUID(deviceUUID: string) {
    const deleteData = prisma.insectHistory.deleteMany({
        where: {
            device_uuid: deviceUUID
        }
    })
    return deleteData;
  }

  public async delete(id: number) {
    const deleteData = prisma.insectHistory.delete({
        where: {
            id: id
        }
    })
    return deleteData;
  }
}
