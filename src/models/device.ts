import { DeviceSetting } from './deviceSetting';

export interface Device {
  id?: number;
  insect_type_id: number;
  device_name: string;
  device_uuid: string;
  device_usim: string;
  address_sido: string;
  address_gungu: string;
  address_dong: string;
  address_detail: string;
  latitude: number;
  longitude: number;
  mode: number;
  ip_address: string;
  on_time: string;
  co2_on_time: string;
  co2_period: number;
  insect_count: number;
  battery: number;
  charge: number;
  fan: number;
  valid_token: string | null;
  token_expired: Date | null;
  device_date: Date | null;
  updated_date: Date | null;
  created_date: Date;
  last_offline_alert_date: Date | null;
  last_battery_alert_date: Date | null;
  last_collection_alert_date: Date | null;

  deviceSetting?: DeviceSetting | null;
}
