# datalab-trend (Vercel 배포용)

네이버 데이터랩 쇼핑 트렌드 분석 웹서비스 — Vercel Serverless Functions 버전

## 프로젝트 구조

```
datalab-trend-vercel/
├── api/
│   ├── analyze.js    ← /api/analyze 서버리스 함수
│   └── drill.js      ← /api/drill 서버리스 함수
├── public/
│   └── index.html    ← 프론트엔드
├── vercel.json       ← 라우팅 설정
├── package.json
└── .gitignore
```

## 배포 방법

### 방법 1: Vercel CLI 사용

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 폴더로 이동
cd datalab-trend-vercel

# 3. 로그인
vercel login

# 4. 배포 (처음 실행 시 프로젝트 설정 안내가 나옵니다)
vercel

# 5. 프로덕션 배포
vercel --prod
```

### 방법 2: GitHub 연동 (추천)

1. 이 폴더를 GitHub 저장소에 push
2. [vercel.com](https://vercel.com) 에서 "New Project" 클릭
3. GitHub 저장소 선택 → Import
4. 환경 변수 설정 후 Deploy

## 환경 변수 설정 (필수!)

Vercel 대시보드 → 프로젝트 → Settings → Environment Variables 에서:

| 이름 | 값 |
|------|-----|
| `ANTHROPIC_API_KEY` | `sk-ant-...` (본인의 Anthropic API 키) |

⚠️ **API 키 없이는 작동하지 않습니다.** [console.anthropic.com](https://console.anthropic.com)에서 발급받으세요.
