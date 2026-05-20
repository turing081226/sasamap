-- ==========================================
-- 📍 "내가 여기 있어요 / 있을 거에요" 위치 공유 기능 테이블 스키마
-- 파일 경로: data/user_occupancies.sql
-- ==========================================

-- 1. 기존 테이블이 존재할 경우 삭제 (선택 사항)
-- DROP TABLE IF EXISTS user_occupancies;

-- 2. user_occupancies 테이블 생성
CREATE TABLE user_occupancies (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL,         -- 1(월) ~ 5(금)
  period INT NOT NULL,              -- 1 ~ 9교시
  occupy_type VARCHAR(20) NOT NULL, -- 'CURRENT' (여기 있어요) 또는 'FUTURE' (여기 있을거에요)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, day_of_week, period)
);

-- 3. 설명 인덱스 추가 (조회 성능 최적화용)
CREATE INDEX idx_user_occupancies_lookup ON user_occupancies (day_of_week, period);
