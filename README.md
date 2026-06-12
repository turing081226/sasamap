# SASA 공강맵

SASA 학생들이 교실 공강 상태, 개인 시간표, 친구 위치 공유, 관리자용 시간표/교실 데이터를 확인하는 웹앱입니다.

## 구조

- `client/`: Vite + React 프론트엔드
- `server/`: Express API와 PostgreSQL 연결 코드
- `api/`: Vercel 서버리스 엔트리포인트
- `data/`, `scripts/`: 지도/교실 데이터 가공 스크립트

## 로컬 실행

```bash
cd client
npm install
npm run dev
```

루트에서 배포 빌드 검증:

```bash
npm run check
```

## 데이터베이스

Vercel 배포에서는 외부 PostgreSQL 데이터베이스를 사용합니다. `DATABASE_URL` 또는 `POSTGRES_URL` 환경변수가 필수입니다.

자세한 설정은 [docs/vercel-external-db.md](docs/vercel-external-db.md)를 참고하세요.
