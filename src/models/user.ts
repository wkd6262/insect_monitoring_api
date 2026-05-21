export interface User {
  id?: number;
  user_id: string;
  password: string;
  user_level: number;
  last_login_date?: Date | null;
  created_date: Date;
}
