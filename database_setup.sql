-- =========================================================================
-- 💡 안내: 모든 생성문에는 'IF NOT EXISTS'가 포함되어 있습니다.
-- 따라서 이 스크립트 전체를 실행하더라도 기존에 존재하는 테이블(예: users)과
-- 그 안의 데이터는 절대 지워지거나 덮어씌워지지 않습니다. 
-- 안심하고 전체를 실행하시거나, 필요한 새 테이블 부분만 복사해서 실행하셔도 됩니다.
-- =========================================================================

-- 사용자 테이블 (users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 교실/공간 테이블 (rooms)
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    floor INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 정규 시간표 테이블 (timetables - 교실 기준 정규 수업)
CREATE TABLE IF NOT EXISTS timetables (
    id SERIAL PRIMARY KEY,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL, -- 1:월, 2:화, 3:수, 4:목, 5:금
    period INTEGER NOT NULL,      -- 1~9교시
    subject VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 사용자 개인 시간표 (user_timetables)
CREATE TABLE IF NOT EXISTS user_timetables (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    period INTEGER NOT NULL,
    subject VARCHAR(255),
    room_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 내 위치 등록 (user_occupancies - 현재/미래 사용자 위치 공유)
CREATE TABLE IF NOT EXISTS user_occupancies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    period INTEGER NOT NULL,
    occupy_type VARCHAR(50), -- 'CURRENT', 'FUTURE' 등
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, day_of_week, period) -- 동일 시간에 하나의 위치만 등록 가능하도록 제약
);

-- 친구 기능 테이블 (friends - 친구 요청 및 수락)
CREATE TABLE IF NOT EXISTS friends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    friend_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'BLOCKED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, friend_id) -- 중복 친구 요청 방지
);

-- 사용자 계획 및 알림 기능 (추가 기능 대응)
CREATE TABLE IF NOT EXISTS user_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    plan_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notifications (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notification_time VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
