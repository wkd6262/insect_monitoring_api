-- insect_monitoring 임시 데이터 (현재 schema.prisma 기준)
-- 로그인: admin / 1234

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
(5, '서울특별시', '영등포구', '여의동');

INSERT INTO `CollectionHistory` (
  `id`, `device_id`, `insect_name`, `image_file`,
  `address_sido`, `address_gungu`, `address_dong`, `address_detail`,
  `latitude`, `longitude`, `collect_count`, `status`, `memo`, `created_date`
) VALUES
(1, NULL, '러브버그 유충', '/uploads/seed/sample-1.jpg',
 '서울특별시', '강남구', '역삼동', '테헤란로 123',
 37.5012, 127.0396, 5, 'good', '양호 구간 샘플', '2026-05-19 14:00:00'),
(2, NULL, '러브버그 유충', '/uploads/seed/sample-2.jpg',
 '서울특별시', '송파구', '잠실동', '올림픽로 45',
 37.5133, 127.1028, 28, 'normal', '보통 구간 샘플', '2026-05-19 14:00:00'),
(3, NULL, '러브버그 유충', '',
 '서울특별시', '마포구', '상암동', '월드컵북로 396',
 37.5791, 126.8895, 72, 'warning', '주의 구간 샘플', '2026-05-18 14:00:00'),
(4, NULL, '러브버그 유충', '',
 '서울특별시', '노원구', '상계동', '노해로 70',
 37.6542, 127.0618, 15, 'normal', '', '2026-05-17 14:00:00'),
(5, NULL, '러브버그 유충', '/uploads/seed/sample-5.jpg',
 '서울특별시', '영등포구', '여의동', '여의대로 108',
 37.5219, 126.9245, 110, 'bad', '방제 필요 샘플', '2026-05-19 15:00:00');

INSERT INTO `Statistics` (`id`, `good_count`, `normal_count`, `warning_count`, `bad_count`) VALUES
(1, 1, 2, 1, 1);

