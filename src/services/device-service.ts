import prisma from '../prisma';
import { Device } from '../models/device';

export class DeviceService {
  public async register(device: Device): Promise<Device> {
      const newDeviceData: Device = await prisma.device.create({data: {...device, deviceSetting: undefined}});
      return newDeviceData;
  }
  
  public async count() {
      const count: number = await prisma.device.count();
      return count;
  }

  public async findDeviceOnlyUUID() {
    const devices: Device[]  = await prisma.device.findMany({
        where: {
            device_name: {equals: ''}
        }
    });
    return devices;
  }

  public async findDevicesByUUIDs(uuids: string[]): Promise<Device[]> {
    const deviceList: Device[] = await prisma.device.findMany({
        where: {
            device_uuid: {
                in: uuids,
            },
            device_name: { not: '' } // 기존 findAll의 조건 유지
        },
        include: {
            deviceSetting: true,
        }
    });
    return deviceList;
  }

 
   public async findDeviceAndCount(count: number): Promise<Device[]> {
    const devices: Device[]  = await prisma.device.findMany({
        where: {
            device_name: {not: ''}, //완전히 생성된 장비일 경우 검색 가능.
            insect_count: {
                gte: count
            }
        },
    });
    return devices;
  }

  /*
  public async findDeviceByGroupIdAndCount(groupId: number, count: number): Promise<Device[]> {
    const devices: Device[]  = await prisma.device.findMany({
        where: {
            device_name: {not: ''}, //완전히 생성된 장비일 경우 검색 가능.
            ...(groupId !== 0 && { device_group_id: groupId }),
            insect_count: {
                gte: count
            }
        },
        include: {
            deviceGroup: true,
        }
    });
    return devices;
  }
  */


  /*
  public async findDeviceByGroupId(groupId: number): Promise<Device[]> {
    const devices: Device[]  = await prisma.device.findMany({
        where: {
            ...(groupId !== 0 && { device_group_id: groupId })
        }
    });
    return devices;
  }
  */

    public async findDeviceOption(
        addressSido: string,
        addressGungu: string,
        addressDong: string,
        deviceId: number,
        deviceStatus: string // 'good', 'warning', 'bad'
    ): Promise<Device[]> {
        const deviceFilters: any = {
            device_name: { not: '' }
        };

        if (addressSido) deviceFilters.address_sido = addressSido;
        if (addressGungu) deviceFilters.address_gungu = addressGungu;
        if (addressDong) deviceFilters.address_dong = addressDong;
        if (deviceId !== 0) deviceFilters.id = deviceId;

        // status 필터는 여기서 직접 사용하지 않음

        const deviceList = await prisma.device.findMany({
            where: deviceFilters,
            include: {
                // deviceGroup: true,
                deviceSetting: true, // 상태 계산을 위해 DeviceSetting을 반드시 포함
            },
            orderBy: {
                created_date: 'desc',
            }
        });

        // deviceStatus 값이 있을 경우에만 결과 목록을 필터링
        if (deviceStatus) {
            return deviceList.filter(item => {
                const device = item;
                const setting = item.deviceSetting;

                // deviceSetting 정보가 없으면 필터링에서 제외
                if (!device || !setting) {
                    return false;
                }

                const { insect_count } = device;
                const { warning_min, warning_max } = setting;

                if (deviceStatus === 'good') {
                    return insect_count < warning_min;
                } else if (deviceStatus === 'warning') {
                    return insect_count >= warning_min && insect_count <= warning_max;
                } else if (deviceStatus === 'bad') {
                    return insect_count > warning_max;
                }
                return false; // 해당되지 않는 status 값이면 제외
            });
        }

        return deviceList; // status 필터가 없으면 전체 목록 반환
    }

  public async searchDeviceByDeviceUUID(deviceUUID: string): Promise<Device[]> {
    const device: Device[] = await prisma.device.findMany({
        where: {
            AND: [
                {device_name: {not: ''}}, //완전히 생성된 장비일 경우 검색 가능.
                {device_uuid: {contains: deviceUUID}}
            ],
        },
        include: {
            // deviceGroup: true,
        }
    });
    return device;
  }

  public async findDeviceByDeviceUUID(deviceUUID: string): Promise<Device | null> {
      const device: Device | null  = await prisma.device.findUnique({
          where: {
              device_uuid: deviceUUID
          },
          include: {
            // deviceGroup: true,
          }
      });
      return device;
  }

  public async findDeviceByDeviceUSIM(deviceUSIM: string): Promise<Device | null> {
      const device: Device | null  = await prisma.device.findUnique({
          where: {
              device_usim: deviceUSIM
          },
          include: {
            // deviceGroup: true,
          }
      });
      return device;
  }
  
  public async findDeviceById(id: number): Promise<Device | null> {
      const device: Device | null  = await prisma.device.findUnique({
        where: {
            id: id 
        },
        include: {
            // deviceGroup: true,
        }
      });
      return device;
  }

  public async findAll(): Promise<Device[]> {
    const deviceList: Device[] = await prisma.device.findMany({
        where: {
            device_name: {not: ''}
        },
        include: {
            // deviceGroup: true,
            deviceSetting: true,
        }
    });
    return deviceList;
  }

  public async find(page: number, count: number): Promise<Device[]> {
      const deviceList: Device[] = await prisma.device.findMany({
          orderBy: {
              created_date: 'desc'
          },
          skip: (page - 1) * count,
          take: count
      });
      return deviceList;
  }
  
  public async update(id: number, device: Device): Promise<Device | null> {
      const deviceData: Device | null  = await prisma.device.update({
          where: {
              id: id
          },
          data: {
            ...device,
            // deviceGroup: undefined,
            deviceSetting: undefined
          }
      });
      return deviceData;
  }

public async updateDevices(
    deviceUUIDs: string[],
    address_sido?: string,
    address_gungu?: string,
    address_dong?: string,
    address_detail?: string,
    device_name?: string // [추가] 장비명 변경을 위한 파라미터
  ): Promise<number> {
    
    // 업데이트할 데이터 객체 동적 생성
    const updateData: any = {};
    if (address_sido) updateData.address_sido = address_sido;
    if (address_gungu) updateData.address_gungu = address_gungu;
    if (address_dong) updateData.address_dong = address_dong;
    if (address_detail) updateData.address_detail = address_detail;
    if (device_name) updateData.device_name = device_name;

    // 업데이트할 내용이 없으면 0 반환
    if (Object.keys(updateData).length === 0) {
        return 0;
    }

    const result = await prisma.device.updateMany({
      where: {
        device_uuid : {
            in: deviceUUIDs
        }
      },
      data: updateData,
    });
    return result.count;
  }

  // 단일 디바이스의 device_uuid, device_usim만 변경 (디바이스 테이블만 수정)
  public async updateUuidUsim(id: number, device_uuid: string, device_usim: string): Promise<Device | null> {
      const deviceData: Device | null  = await prisma.device.update({
          where: {
              id: id
          },
          data: {
              device_uuid: device_uuid,
              device_usim: device_usim
          }
      });
      return deviceData;
  }

  public async deleteByUUID(deviceUUID: string) {
    const deleteDevice = prisma.device.deleteMany({
        where: {
            device_uuid: deviceUUID
        }
    })
    return deleteDevice;
  }

  /*
   public async deleteByGroupId(groupId: number) {
    const deleteDevice = prisma.device.deleteMany({
        where: {
            device_group_id: groupId
        }
    })
    return deleteDevice;
  } 
  */

  
  public async delete(id: number) {
    const deleteDevice = prisma.device.delete({
        where: {
            id: id
        }
    })
    return deleteDevice;
  }
}