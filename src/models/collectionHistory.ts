export interface CollectionHistory {
  id?: number;
  device_id?: number | null;
  insect_name: string;
  image_file: string;
  address_sido: string;
  address_gungu: string;
  address_dong: string;
  address_detail: string;
  latitude: number;
  longitude: number;
  collect_count: number;
  collect_count_min: number;
  collect_count_max: number | null;
  status: string;
  memo: string;
  created_date?: Date;
}
