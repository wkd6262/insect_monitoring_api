import prisma from '../prisma';
import { UserDevice } from '../models/userDevice';

export class UserDeviceService {
  public async findUserDeviceByUserId(userId: number): Promise<UserDevice[]> {
    const userDeviceList: UserDevice[] = await prisma.userDevice.findMany({
      where: {
        user_id: userId,
      },
      include: {
        device: true,
      },
    });
    return userDeviceList;
  }

  public async findUserDeviceByUserIdAndCount(
    userId: number,
    count: number,
  ): Promise<UserDevice[]> {
    const userDeviceList: UserDevice[] = await prisma.userDevice.findMany({
      where: {
        user_id: userId,
        device: {
          insect_count: {
            gte: count,
          },
        },
      },
      include: {
        device: true,
      },
    });
    return userDeviceList;
  }

  public async findUserDeviceByUserIdAndDeviceId(
    userId: number,
    deviceUUID: string,
  ): Promise<UserDevice[]> {
    const userDeviceList: UserDevice[] = await prisma.userDevice.findMany({
      where: {
        user_id: userId,
        device_uuid: deviceUUID,
      },
      include: {
        device: true,
      },
    });
    return userDeviceList;
  }

  public async findUsersByDeviceUUID(deviceUUID: string): Promise<UserDevice[]> {
    const userDeviceList: UserDevice[] = await prisma.userDevice.findMany({
      where: {
        device_uuid: deviceUUID,
      },
      include: {
        device: true,
      },
    });
    return userDeviceList;
  }

  public async findAllUserDevicesByUserId(userId: number): Promise<UserDevice[]> {
    const userDeviceList: UserDevice[] = await prisma.userDevice.findMany({
      where: {
        user_id: userId,
      },
      include: {
        device: true,
      },
    });
    return userDeviceList;
  }

  public async createUserDevice(userId: number, deviceUUID: string): Promise<UserDevice> {
    const userDevice = await prisma.userDevice.create({
      data: {
        user_id: userId,
        device_uuid: deviceUUID,
        created_date: new Date(),
      },
    });
    return userDevice;
  }

  public async updateDeviceUuid(oldDeviceUuid: string, newDeviceUuid: string): Promise<void> {
    await prisma.userDevice.updateMany({
      where: {
        device_uuid: oldDeviceUuid,
      },
      data: {
        device_uuid: newDeviceUuid,
      },
    });
  }

  public async deleteUserDeviceByUUID(deviceUUID: string): Promise<void> {
    await prisma.userDevice.deleteMany({
      where: {
        device_uuid: deviceUUID,
      },
    });
  }

  public async deleteUserDevice(id: number): Promise<void> {
    await prisma.userDevice.deleteMany({
      where: {
        user_id: id,
      },
    });
  }
}
