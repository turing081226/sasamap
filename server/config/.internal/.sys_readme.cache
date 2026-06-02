# 🏫 SASA 공강맵

세종과학예술영재학교 교실 찾기 & 빈 교실 조회 서비스

---

## 📁 프로젝트 구조

```
sasamap/
├── client/   # 프론트엔드 (React + Vite)
└── server/   # 백엔드 (Node.js + Express)
```

---

## ⚙️ 환경 설정

### 1. 백엔드 환경변수 설정 (`server/.env`)

`server/.env.example`을 복사해서 `server/.env`로 만들고 값을 채워주세요.

```env
DATABASE_URL=postgresql://postgres:비밀번호@localhost:5432/sasamap

PORT=3001
JWT_SECRET=랜덤문자열
GOOGLE_CLIENT_ID=구글클라이언트ID (선택)
```

### 2. 프론트엔드 환경변수 설정 (`client/.env`)

`client/.env.example`을 복사해서 `client/.env`로 만들어주세요.

```env
VITE_API_URL=http://localhost:3001/api
```

---

## 🗄️ 데이터베이스 연결 및 초기화

이 프로젝트는 **PostgreSQL**을 사용합니다.

### A. 기존 데이터베이스를 연결하는 경우 (데이터가 이미 있을 때)
1. **환경변수 설정**: `server/.env` 파일의 `DATABASE_URL`을 기존에 사용하던 데이터베이스 연결 문자열로 변경하세요.
2. **초기화 스크립트 생략**: 이미 테이블과 데이터가 존재하므로, 바로 서버를 실행하시면 됩니다.

### B. 새로 데이터베이스를 구축하는 경우 (처음 실행 시)
1. **PostgreSQL 설치 및 실행**: PostgreSQL 서버가 실행 중인지 확인하고 `sasamap` 데이터베이스를 생성합니다.
2. **환경변수 설정**: `server/.env`에 사용할 DB 연결 정보(`DATABASE_URL`)를 입력합니다.
3. **초기 데이터 복원**: 프로젝트 루트 디렉토리에 있는 `sasamap_pg_dump.sql` 파일을 이용해 데이터베이스를 초기화합니다.
   ```bash
   psql -U postgres -d sasamap -f sasamap_pg_dump.sql
   ```

---

## 🚀 서버 실행 방법

터미널을 **두 개** 열어서 각각 실행하세요.

### 터미널 1 — 백엔드 서버

```bash
cd server
node server.js
```

> ✅ `서버 실행중, 포트: 3001` 메시지가 나오면 성공

### 터미널 2 — 프론트엔드 개발 서버

```bash
cd client
npm run dev
```

> ✅ `http://localhost:5173/` 주소가 나오면 성공

---

## 🌐 접속

브라우저에서 아래 주소로 접속하세요:

```
http://localhost:5173
```

---

## 🛠️ 기술 스택

| 구분 | 기술 |
|------|------|
| 프론트엔드 | React, Vite, React Router |
| 백엔드 | Node.js, Express |
| 데이터베이스 | PostgreSQL |
| 인증 | JWT, Google OAuth2 |

---

## ⚠️ 주의사항

- PostgreSQL이 실행 중이어야 DB에 연결됩니다.
- `client/.env`의 `VITE_API_URL`이 `http://localhost:3001/api`인지 확인하세요.
- 로그인은 `@sasa.hs.kr` 구글 계정으로만 허용됩니다.
- 관리자 권한은 DB의 `users` 테이블에서 `role` 컬럼을 `ADMIN`으로 설정하면 부여됩니다. (기본 관리자 계정: woolrabit77@sasa.hs.kr)

---

## 🛠️ 문제 해결 (Troubleshooting)

**Q. 화면에서 데이터(검색, 교실 등)를 계속 불러오기만 하고(무한 로딩) 넘어가지 않아요.**
A. 보통 프론트엔드가 백엔드 서버에 연결하지 못할 때 발생합니다.
1. 터미널이 **두 개** 열려 있고, 각각 `node server.js`와 `npm run dev`가 실행 중인지 확인하세요.
2. `client/.env` 파일의 `VITE_API_URL`이 현재 컴퓨터의 백엔드 주소(`http://localhost:3001/api`)와 일치하는지 확인하세요.
3. 백엔드 콘솔에 에러가 나면서 꺼져있지 않은지 확인하고, 꺼져있다면 다시 실행해 주세요.
