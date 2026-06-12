# Vercel 외부 데이터베이스 연결

이 프로젝트는 Vercel 서버리스 함수에서 외부 PostgreSQL 데이터베이스에 접속하는 방식을 기준으로 한다.

## 필수 환경변수

Vercel Project Settings > Environment Variables에 아래 값을 설정한다.

- `DATABASE_URL`: 외부 PostgreSQL 연결 문자열. 없으면 `POSTGRES_URL`을 사용한다.
- `JWT_SECRET`: 로그인 세션 JWT 서명 키.
- `GOOGLE_CLIENT_ID`: 서버에서 Google ID 토큰 검증에 사용한다.
- `VITE_GOOGLE_CLIENT_ID`: 클라이언트 Google 로그인 버튼에 사용한다.
- `VITE_API_URL`: 선택값. 같은 Vercel 프로젝트에 배포하면 비워도 `/api`를 사용한다.

## DATABASE_URL 예시

```text
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
```

Neon, Supabase, Railway, Render, Vercel Postgres 같은 외부 PostgreSQL 제공자의 pooled connection URL을 사용할 수 있다.

## 코드 기준

- [server/config/db.js](../server/config/db.js)는 `DATABASE_URL` 또는 `POSTGRES_URL`을 필수로 요구한다.
- 로컬 주소가 아닌 데이터베이스는 SSL을 사용한다.
- 서버 코드는 PostgreSQL `pg` Pool로 접속한다.
- MySQL 초기화 스크립트는 과거 이식 흔적이므로 새 배포 경로에서는 사용하지 않는다.

## 배포 전 확인

1. 외부 PostgreSQL에 필요한 테이블이 생성되어 있어야 한다.
2. Vercel 환경변수에 `DATABASE_URL`, `JWT_SECRET`, Google client id를 설정한다.
3. 로컬에서 `npm run check`를 실행한다.
4. Vercel 배포 후 `/api/health`에서 DB 연결 여부를 확인한다.
