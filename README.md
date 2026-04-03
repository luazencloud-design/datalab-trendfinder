# 네이버 데이터랩 쇼핑 트렌드 분석

월별 인기 쇼핑 카테고리와 브랜드 순위를 AI로 분석하는 웹서비스입니다.

---

## 실행 환경
- Node.js 18 이상
- Anthropic API 키 (https://console.anthropic.com)

---

## 설치 및 실행

### 1단계 — 패키지 설치
```bash
npm install
```

### 2단계 — API 키 설정
`.env.example` 파일을 복사해서 `.env` 파일을 만들고, API 키를 입력합니다.
```bash
cp .env.example .env
```
`.env` 파일을 열어서 아래와 같이 수정:
```
ANTHROPIC_API_KEY=sk-ant-실제키입력
```

### 3단계 — 서버 실행
```bash
npm start
```

브라우저에서 http://localhost:3000 접속

---

## 폴더 구조
```
datalab-trend/
├── server.js          ← Node.js 백엔드 (API 키 보관)
├── package.json
├── .env               ← API 키 (절대 공유 금지!)
├── .env.example       ← .env 예시 파일
├── .gitignore
└── public/
    └── index.html     ← 프론트엔드
```

---

## 클라우드 배포 방법

### Render.com (무료, 추천)
1. https://render.com 회원가입
2. GitHub에 이 프로젝트 업로드
3. New Web Service 생성 → GitHub 연결
4. Environment Variables에 `ANTHROPIC_API_KEY` 추가
5. 배포 완료 → 발급받은 URL 공유

### Railway.app
1. https://railway.app 회원가입
2. New Project → Deploy from GitHub
3. Variables 탭에서 `ANTHROPIC_API_KEY` 추가
4. 자동 배포 완료

---

## API 비용 안내
- 모델: claude-haiku (가장 저렴한 모델 사용)
- 분석 1회당 약 $0.001 ~ $0.003 수준
- 요청 제한: 분당 10회 (rate limit 설정됨)

---

## 주의사항
- `.env` 파일은 절대 GitHub에 올리지 마세요 (.gitignore에 포함됨)
- API 키가 노출되면 즉시 https://console.anthropic.com 에서 삭제하세요
