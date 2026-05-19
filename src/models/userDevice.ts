import { Device } from './device';

export interface UserDevice {
  id?: number;
  user_id: number;
  device_uuid: string;
  created_date: Date;

  device?: Device;
}
