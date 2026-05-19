export interface User {
  id?: number;
  user_id: string; //유저 아이디.
  password: string; //비밀번호.
  cellphone: string; // 전화번호
  user_level: number; //유저 레벨 (0: 일반, 1: 관리자)
  last_login_date?: Date | null; //마지막 로그인 날짜.
  created_date: Date; //생성 날짜
}
