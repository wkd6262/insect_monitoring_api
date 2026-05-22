-- insect_monitoring 1차 시드 (schema.prisma 기준)
-- 로그인: admin / 1234  (owner01 / 1234)
--
-- status · collect_count (정정본)
--   good    : 10 미만
--   normal  : 10 이상 ~ 50 미만
--   warning : 50 이상 ~ 100 미만
--   bad     : 100 이상
--
-- collect_count_min / collect_count_max (드롭다운 4구간)
--   0~10마리      : min 0,   max 10
--   10~50마리     : min 10,  max 50
--   50~100마리    : min 50,  max 100
--   100마리 이상  : min 100, max NULL
-- collect_count 는 구간 내 예시값(시드·표시용) 유지
-- Statistics 행은 CollectionHistory status 건수와 동일해야 함 (POST /statistics/refresh 전 summary용)

SET FOREIGN_KEY_CHECKS = 0;
DELETE FROM `CollectionHistory`;
DELETE FROM `Statistics`;
DELETE FROM `User`;
DELETE FROM `Address`;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO `User` (`id`, `user_id`, `password`, `user_level`, `last_login_date`, `created_date`) VALUES
(1, 'admin', '1ARVn2Auq2/WAqx2gNrL+q3RNjAzXpUfCXrzkA6d4Xa22yhRLy4AC50E+6UTPoscbo31nbOoq51gvkuXzJ6B2w==', 1, NULL, '2026-05-19 09:00:00'),
(2, 'owner01', '1ARVn2Auq2/WAqx2gNrL+q3RNjAzXpUfCXrzkA6d4Xa22yhRLy4AC50E+6UTPoscbo31nbOoq51gvkuXzJ6B2w==', 0, NULL, '2026-05-19 09:00:00');

INSERT INTO `Address` (`id`, `address_sido`, `address_gungu`, `address_dong`) VALUES
(1, '서울특별시', '강남구', '역삼동'),
(2, '서울특별시', '송파구', '잠실동'),
(3, '서울특별시', '마포구', '상암동'),
(4, '서울특별시', '노원구', '상계동'),
(5, '서울특별시', '영등포구', '여의동'),
(6, '서울특별시', '서초구', '서초동'),
(7, '서울특별시', '강서구', '화곡동'),
(8, '서울특별시', '종로구', '종로1가'),
(9, '서울특별시', '중구', '을지로동'),
(10, '서울특별시', '동작구', '사당동');

INSERT INTO `CollectionHistory` (
  `id`, `device_id`, `insect_name`, `image_file`,
  `address_sido`, `address_gungu`, `address_dong`, `address_detail`,
  `latitude`, `longitude`, `collect_count`, `collect_count_min`, `collect_count_max`,
  `status`, `memo`, `created_date`
) VALUES
-- 양호 (good) × 3 — 0~10마리
(1, NULL, '러브버그 유충', '/uploads/seed/sample-1.jpg',
 '서울특별시', '강남구', '역삼동', '테헤란로 123',
 37.5012, 127.0396, 5, 0, 10, 'good', '현장메모: 역삼역 인근 녹지', '2026-05-19 14:00:00'),
(2, NULL, '러브버그 유충', '/uploads/seed/sample-2.jpg',
 '서울특별시', '서초구', '서초동', '서초대로 77',
 37.4837, 127.0324, 8, 0, 10, 'good', '현장메모: 서초 공원 옆', '2026-05-18 11:30:00'),
(3, NULL, '러브버그 유충', '',
 '서울특별시', '동작구', '사당동', '사당로 161',
 37.4768, 126.9816, 3, 0, 10, 'good', '드롭다운 구간 0~10마리 샘플', '2026-05-17 09:15:00'),

-- 보통 (normal) × 3 — 10~50마리
(4, NULL, '러브버그 유충', '/uploads/seed/sample-3.jpg',
 '서울특별시', '송파구', '잠실동', '올림픽로 45',
 37.5133, 127.1028, 28, 10, 50, 'normal', '현장메모: 잠실 운동장 주변', '2026-05-19 13:00:00'),
(5, NULL, '러브버그 유충', '',
 '서울특별시', '노원구', '상계동', '노해로 70',
 37.6542, 127.0618, 15, 10, 50, 'normal', '드롭다운 구간 10~50마리 샘플', '2026-05-16 16:45:00'),
(6, NULL, '러브버그 유충', '',
 '서울특별시', '강서구', '화곡동', '화곡로 123',
 37.5412, 126.8403, 45, 10, 50, 'normal', '현장메모: 화곡천 산책로', '2026-05-15 10:20:00'),

-- 주의 (warning) × 2 — 50~100마리
(7, NULL, '러브버그 유충', '',
 '서울특별시', '마포구', '상암동', '월드컵북로 396',
 37.5791, 126.8895, 72, 50, 100, 'warning', '드롭다운 구간 50~100마리 샘플', '2026-05-18 14:00:00'),
(8, NULL, '러브버그 유충', '/uploads/seed/sample-4.jpg',
 '서울특별시', '종로구', '종로1가', '종로 51',
 37.5704, 126.9827, 88, 50, 100, 'warning', '현장메모: 종로 골목', '2026-05-14 15:30:00'),

-- 방제 필요 (bad) × 2 — 100마리 이상
(9, NULL, '러브버그 유충', '/uploads/seed/sample-5.jpg',
 '서울특별시', '영등포구', '여의동', '여의대로 108',
 37.5219, 126.9245, 110, 100, NULL, 'bad', '현장메모: 여의도공원 인근', '2026-05-19 15:00:00'),
(10, NULL, '러브버그 유충', '',
 '서울특별시', '중구', '을지로동', '을지로 100',
 37.5660, 127.0095, 100, 100, NULL, 'bad', '드롭다운 구간 100마리 이상 샘플', '2026-05-13 12:00:00');

INSERT INTO `Statistics` (`id`, `good_count`, `normal_count`, `warning_count`, `bad_count`) VALUES
(1, 3, 3, 2, 2);
