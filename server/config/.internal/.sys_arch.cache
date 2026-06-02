# SASA 공강맵 프로젝트 구조 및 가이드

이 문서는 SASA 공강맵 어플리케이션의 아키텍처, 주요 폴더 및 파일 구조, 핵심 기능의 흐름을 정리하여 향후 유지보수와 기능 확장을 돕기 위해 작성되었습니다.

## 🛠 기술 스택
- **프론트엔드 (Client):** React, Vite, React Router, CSS Variables (바닐라 CSS)
- **백엔드 (Server):** Node.js, Express, jsonwebtoken (JWT 기반 쿠키 인증), express-rate-limit
- **데이터베이스:** PostgreSQL (Vercel Postgres 또는 외부 서비스 연동)
- **인프라/배포:** Vercel (Front + Serverless API 통합 배포 구조)

---

## 📂 디렉토리 구조 요약

```text
sasamap-1/
├── client/                 # React 프론트엔드 코드
│   ├── public/             # 파비콘, 정적 에셋
│   ├── src/
│   │   ├── assets/         # 아이콘, 로고 이미지 등
│   │   ├── components/     # 재사용 가능한 UI 컴포넌트 (ProtectedRoute, RoomManager 등)
│   │   ├── contexts/       # 전역 상태 관리 (AuthContext, ToastContext 등)
│   │   ├── pages/          # 각 화면 단위 라우트 (Home, FindRoom, MyPage 등)
│   │   ├── main.jsx        # 리액트 진입점 및 Fetch 글로벌 인터셉터 (쿠키 설정)
│   │   └── App.jsx         # 라우팅 및 기본 레이아웃 구성
│   └── package.json
│
├── server/                 # Express 백엔드 서버 로직
│   ├── config/             # DB 연결, 환경 변수 등 설정 (db.js)
│   ├── controllers/        # 비즈니스 로직 및 응답 처리 (API의 뇌)
│   ├── middlewares/        # 보안 및 권한 검사 (auth.middleware.js)
│   ├── models/             # DB 쿼리를 감싸는 모델 계층 (선택적 사용, 현재 user.model.js 핵심)
│   ├── routes/             # URL 경로별 컨트롤러 맵핑 (Express Router)
│   ├── scripts/            # 초기 DB 셋업, 더미 데이터 삽입용 스크립트 모음
│   └── server.js           # Express 서버 진입점 (Vercel 배포 시 엔트리포인트)
│
├── api/
│   └── index.js            # Vercel Serverless Function 배포용 진입점 (server.js 연결)
│
├── vercel.json             # Vercel 배포 시 라우팅 및 빌드 설정 파일
├── package.json            # 루트 모듈 (백엔드 의존성)
└── database_setup.sql      # DB 초기 구성 참고용 SQL 스크립트
```

---

## 🚀 주요 기능 및 플로우 설명

### 1. 인증 및 권한 (Authentication & Authorization)
- **로그인 플로우:** 사용자가 클라이언트(구글 로그인)에서 Google JWT(credential)를 획득 → `POST /api/auth/google`로 전송 → 백엔드에서 검증 후 `@sasa.hs.kr` 도메인만 통과 → 자체 JWT를 생성하여 **`HttpOnly` 쿠키**(`token`)로 클라이언트 브라우저에 구워줌.
- **쿠키 기반 통신:** 이후 모든 클라이언트의 `fetch` 요청은 `main.jsx`의 글로벌 인터셉터를 거쳐 `credentials: 'include'`가 자동 적용되며, 백엔드의 `auth.middleware.js`가 이 쿠키를 읽어 유저 신원(`req.user`)을 검증합니다.
- **보안 (Rate Limiting & IDOR):** 무차별 로그인을 막기 위해 `express-rate-limit`이 적용되어 있으며, 데이터를 수정/삭제하는 API는 항상 `AND user_id = req.user.id` 조건을 확인하여 타인의 데이터 수정을 방지합니다.

### 2. 빈 교실 찾기 (Find Room)
- **로직:** 서버는 요청된 `day_of_week`와 `period`를 기준으로, 해당 시간에 `timetables`(정규수업)이나 `reservations`(행사 등)이 겹치지 않는 모든 교실을 추려 클라이언트에 반환합니다.
- 클라이언트는 지도나 리스트 형태로 이 교실들의 위치와 현황을 사용자에게 시각적으로 보여줍니다.

### 3. 시간표 관리 (Timetable)
- 학생(USER)은 마이페이지/시간표 탭을 통해 개인 맞춤형 시간표(`user_timetables`)를 등록합니다. 등록된 시간표 데이터는 내 친구들이 나를 조회할 때 '수업 중' 상태를 알려주는 기준이 됩니다.
- 관리자(ADMIN)는 전체 학교 정규 시간표(`timetables`) 데이터베이스를 덮어쓰거나 수정할 권한을 가집니다.

### 4. 내 위치 등록 (Occupancy)
- "공강 시간에 내가 어느 교실에 있는지"를 나타내는 시스템입니다.
- 학생이 빈 교실을 선택하고 '등록'하면 `user_occupancies` 테이블에 위치가 기록됩니다. 이 위치는 다른 학생이(친구 상태일 때) 해당 교실을 클릭하거나 친구 목록을 볼 때 노출됩니다.

### 5. 친구 시스템 (Friendship)
- **신청 및 수락:** A가 B의 이메일로 친구 요청을 보내면 `status: PENDING` 상태로 저장. B가 이를 수락하면 `ACCEPTED`가 되어 양방향 친구로 인정됩니다.
- **상태 조회 로직 우선순위:**
  친구가 현재 어디에 있는지 계산할 때는 **1순위:** 내가 지금 등록한 '공강 위치 (`user_occupancies`)' → **2순위:** 현재 내 정규 시간표 시간(`user_timetables`) → **나머지:** '수업시간 아님' 혹은 '공강' 상태로 표시됩니다.

---

## 📝 관리자 모드 가이드
관리자 계정(`role: 'ADMIN'`)으로 로그인하면 네비게이션 바에 "관리자" 탭이 나타납니다.
- **유저 관리:** 전체 유저 목록 조회 및 관리자 권한 부여 가능
- **교실 관리:** 지도에 띄울 교실 데이터 추가/삭제 및 X, Y 좌표 (지도상 위치) 설정 가능
- **시간표 관리:** 전체 학급별 기본 정규 수업 시간표를 업로드하고 관리

---

## ⚠️ 향후 유지보수 시 주의사항
1. **타임존(Timezone):** 배포 환경(Vercel 서버)은 UTC 기준으로 동작하므로, 시간 계산(교시 계산 등)을 할 때는 반드시 `moment-timezone` 또는 JS의 `toLocaleString('en-US', { timeZone: 'Asia/Seoul' })`을 사용하여 한국 시간 기준으로 맞춰주어야 합니다. (현재 `mypage.controller.js`와 `friend.controller.js`에 적용됨)
2. **보안(CORS & Cookie):** Vercel 배포 시 도메인이 동일하면(Same-Site) 쿠키가 원활히 동작하나, 프론트와 서버 도메인이 다를 경우 (Cross-Site) `sameSite: 'none'` 및 `secure: true` 설정과 함께 `cors({ origin: '프론트도메인', credentials: true })` 설정이 필수적입니다.
3. **환경 변수(.env):** DB 주소나 Google Client ID 등 민감한 정보는 소스코드에 커밋되지 않도록 깃허브 `.gitignore`를 철저히 관리하세요.
