# 라스트원 브랜드유통 통합 분석

> 쿠팡 리포터 + 네이버 트렌드 분석 + 백화점 검색 — **3개 분석 도구를 하나의 웹앱으로 통합**한 사내 분석 플랫폼

탭 전환만으로 3가지 분석을 자유롭게 사용할 수 있으며, API 키는 한 번만 입력하면 모든 탭에서 공유됩니다.

---

## 📋 목차

1. [개요](#-개요)
2. [파일 구성](#-파일-구성)
3. [다운로드 방법](#-다운로드-방법)
4. [Vercel 배포 방법](#-vercel-배포-방법)
5. [API 키 발급](#-api-키-발급)
6. [실행 시 화면 안내](#️-실행-시-화면-안내)
7. [기능 원리 & 담당 코드](#-기능-원리--담당-코드)
8. [트러블슈팅](#️-트러블슈팅)
9. [후임자를 위한 메모](#-후임자를-위한-메모)

---

## 🎯 개요

### 통합된 3개 도구

| 탭 | 명칭 | 용도 |
|------|------|------|
| 🛒 | **쿠팡 리포터** | Gemini AI 기반 쿠팡 트렌드 시뮬레이션 + 네이버 검색광고 합산 분석 |
| 📊 | **트렌드 분석** | 월별 네이버 쇼핑 트렌드 분석 + 카테고리 드릴다운 + 검색광고 합산 |
| 🏬 | **백화점 검색** | 롯데/신세계/현대 입점 브랜드 200개 검색량 실시간 조회 + 4년치 과거 추이 |

### 사용 API

- **Google Gemini 2.5 Flash** — 트렌드 시뮬레이션 (쿠팡, 트렌드 탭)
- **네이버 검색광고 API** — 실 검색량 / CPC / 경쟁강도 (3개 탭 모두)
- **네이버 데이터랩 검색어 트렌드 API** — 4년치 월별 추이 (백화점 탭)

---

## 📁 파일 구성

```
lastone-unified/
├── api/                    ← Vercel Serverless Functions
│   ├── analyze.js           ← 트렌드 탭의 Gemini 호출 (POST /api/analyze)
│   ├── drill.js             ← 트렌드 탭의 카테고리 드릴다운 (POST /api/drill)
│   └── proxy.js             ← CORS 프록시 (GET/POST /api/proxy) — DataLab POST 지원
├── index.html              ← 단일 페이지 통합 앱 (CSS + HTML + JS · 약 1900줄)
├── vercel.json             ← Vercel 라우팅 설정
├── package.json            ← Node.js 18+ 명시
└── README.md               ← 이 문서
```

### `index.html` 내부 구조

| 섹션 | 줄 범위 | 내용 |
|------|---------|------|
| `<style>` | 7-340 | 통합 CSS (공유 스타일 + 탭별 고유 스타일) |
| `<body>` | 343-737 | 헤더 + 공유 설정 + 메인 탭 + 3개 패널 |
| 공유 JS | 738-1066 | 키 관리, 프록시, HMAC, Gemini, DataLab 호출 등 |
| 쿠팡 JS | 1070-1370 | `cp_` 접두사 — 쿠팡 탭 전용 함수 |
| 트렌드 JS | 1373-1614 | `dl_` 접두사 — 트렌드 탭 전용 함수 |
| 백화점 JS | 1617-1924 | `lt_` 접두사 — 백화점 탭 전용 함수 |

> **네임스페이스 규칙**: 3개 앱을 한 파일에 합치며 `cp_` / `dl_` / `lt_` 접두사로 ID·함수·변수를 구분했습니다. 공유 자원(API 키 입력란, 프록시 설정 등)에는 접두사가 없습니다.

---

## 📥 다운로드 방법

### 옵션 A — Git Clone (권장)

```bash
git clone https://github.com/luazencloud-design/datalab-trendfinder.git
cd datalab-trendfinder
```

### 옵션 B — ZIP 다운로드

1. GitHub 저장소 페이지 접속
2. 우측 상단 `Code → Download ZIP` 클릭
3. 압축 해제 후 임의 경로에 배치

### 로컬 실행 (배포 없이 빠른 확인)

`index.html`을 브라우저로 열기만 해도 작동합니다. 다만:
- ⚠️ Vercel 프록시(`/api/proxy`)는 작동 안 함 → **프록시 서버 선택**에서 `corsproxy.io` 또는 `allorigins.win`로 변경 필요
- ⚠️ Gemini 분석(`/api/analyze`, `/api/drill`)도 작동 안 함 → 트렌드 탭 분석 불가

따라서 **정상 사용을 위해서는 Vercel 배포가 필수**입니다.

---

## 🚀 Vercel 배포 방법

### 방법 1 — GitHub 연동 (가장 쉬움, 추천)

1. GitHub 저장소가 이미 준비되어 있으므로 [vercel.com/new](https://vercel.com/new) 접속
2. **Import Git Repository** → `luazencloud-design/datalab-trendfinder` 선택 → `Import`
3. 설정 화면:
   - **Framework Preset**: `Other` (자동 감지)
   - **Build Command**: 비워둠
   - **Output Directory**: 비워둠
   - **Install Command**: 비워둠
4. `Deploy` 클릭 → 약 30초 후 `https://<프로젝트명>.vercel.app` 발급

### 방법 2 — Vercel CLI 사용

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 폴더로 이동
cd datalab-trendfinder

# 3. 로그인 (브라우저로 인증)
vercel login

# 4. 프리뷰 배포 (처음 실행 시 프로젝트 초기 설정)
vercel

# 5. 프로덕션 배포
vercel --prod
```

### 환경 변수 (선택사항)

Vercel 대시보드 → 프로젝트 → **Settings → Environment Variables**에서 미리 등록할 수 있습니다 (선택사항):

| 이름 | 값 | 설명 |
|------|-----|------|
| `GEMINI_API_KEY` | `AIza...` | (선택) 입력란이 비어있을 때 폴백 |

> 💡 기본 설계는 **사용자가 브라우저에서 직접 키 입력 → localStorage 저장**입니다. 환경 변수는 안 넣어도 작동합니다.

---

## 🔑 API 키 발급

### 1. Gemini API Key (쿠팡·트렌드 탭에 필요)

1. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) 접속
2. **Create API Key** 클릭
3. `AIza...`로 시작하는 키 복사
4. 앱의 `🔑 API 설정` 펼치기 → 첫 번째 카드(Gemini)에 붙여넣고 `저장`

### 2. 네이버 검색광고 API (3개 탭 모두 필요)

1. [searchad.naver.com](https://searchad.naver.com) 접속 → 로그인
2. **도구 → API 사용 관리** 클릭
3. 다음 3개 항목 복사:
   - Customer ID (광고주 ID, 숫자)
   - Access License (API Key)
   - Secret Key
4. 두 번째 카드(네이버 검색광고)에 입력 후 `저장` → `연결 테스트`로 확인

### 3. 네이버 데이터랩 Open API (백화점 탭 과거 데이터 조회 시 필요)

1. [developers.naver.com/apps](https://developers.naver.com/apps) 접속 → 로그인
2. **애플리케이션 등록** → 사용 API에 **데이터랩(검색어트렌드)** 체크
3. 발급된 **Client ID**, **Client Secret** 복사
4. 세 번째 카드(데이터랩)에 입력 후 `저장` → `연결 테스트`로 확인

> ⚠️ **데이터랩 일일 한도 1,000회** — 한 번의 백화점 분석에 약 10회 소비 (50개 브랜드 ÷ 5개씩 묶어서 호출)

---

## ▶️ 실행 시 화면 안내

### 1단계: API 설정

상단의 `🔑 API 설정 ▼` 버튼을 클릭하면 3개 카드(Gemini / 네이버 검색광고 / 데이터랩)가 펼쳐집니다.
필요한 키를 입력하고 `저장`하면 localStorage에 영구 저장됩니다.

CORS 프록시 토글은 **기본 ON, Vercel 권장**으로 설정되어 있습니다.

### 2단계: 메인 탭 선택

```
[🛒 쿠팡 리포터]   [📊 트렌드 분석]   [🏬 백화점 검색]
```

각 탭은 독립적으로 작동하며, 탭 간 전환 시에도 분석 결과는 메모리에 보존됩니다.

### 3단계 (탭별 사용법)

#### 🛒 쿠팡 리포터
1. 분석 기준일(YYYY-MM-DD) 선택
2. `🔍 분석하기` 클릭
3. 결과: 통합 테이블(브랜드 30개 + 카테고리별 검색광고 합산) / 브랜드 TOP 20 / 카테고리 TOP 10 — 3개 서브탭

#### 📊 트렌드 분석
1. 분석 기준월(YYYY-MM) 선택
2. `🔍 분석하기` 클릭
3. 결과: 좌측 카테고리 리스트(클릭 시 드릴다운) / 우측 브랜드 TOP 30 (필터 탭으로 카테고리 분류) / 하단 합산표

#### 🏬 백화점 검색
1. 백화점 선택 (롯데/신세계/현대)
2. 카테고리 선택 (패션잡화/스포츠레저/패션의류/키즈육아)
3. 뷰 선택:
   - **현재 월 TOP 50** — 검색광고 API만 사용 (빠름)
   - **4년 누적 TOP 50** / **연도별 비교** / **월별 상세** / **급상승·급하락** — 데이터랩 API 추가 사용 (느림)
4. `🔍 검색량 조회` 클릭

---

## 🧬 기능 원리 & 담당 코드

`index.html`의 `<script>` 섹션 함수 매핑입니다.

### 🔧 공유 유틸리티 (738-1066줄)

| 함수 | 줄 | 역할 |
|------|----|----|
| `toggleConfig()` | 741 | API 설정 카드 펼치기/접기 |
| `switchMainTab(tab)` | 747 | 메인 탭 (쿠팡/트렌드/백화점) 전환 |
| `getGeminiKey()` / `saveGeminiKey()` | 763-772 | Gemini 키 localStorage 입출력 |
| `getNaverKeys()` / `saveNaverKeys()` | 774-799 | 네이버 검색광고 키 3종 관리 |
| `getDataLabKeys()` / `saveDataLabKeys()` | 801-822 | 데이터랩 키 2종 관리 |
| `generateSignature()` | 824 | 네이버 검색광고 API용 HMAC-SHA256 서명 (`Web Crypto API` 사용) |
| `useProxy()`, `PROXY_LIST`, `getSelectedProxies()` | 851-867 | CORS 프록시 토글 + 5종 프록시 폴백 (Vercel/local/corsproxy/allorigins/codetabs) |
| `callNaverKeywordAPI(keywords)` | 869 | 네이버 검색광고 호출. 직접/프록시 분기 + 프록시 순차 폴백 |
| `testNaverAPI()` | 930 | "나이키" 키워드로 연결 테스트 |
| `callGeminiAPI(prompt)` | 949 | Gemini 2.5 Flash JSON 모드 호출 |
| `robustParse(raw)` | 963 | Gemini 응답이 JSON 깨질 때 다단계 복구 |
| `callDataLabAPI(keywords, startDate, endDate)` | 977 | 데이터랩 검색어 트렌드 API. **POST 요청을 Vercel 프록시 경유로 전송** |
| `testDataLabAPI()` | 1014 | "나이키" 키워드로 연결 테스트 |
| `getQuotaUsed()` / `incrementQuota()` / `refreshQuotaDisplay()` | 1032-1046 | 데이터랩 일일 호출 카운터 (날짜별 자동 리셋) |

### 🛒 쿠팡 리포터 (`cp_` · 1070-1370줄)

| 함수 | 줄 | 역할 |
|------|----|----|
| `cp_initDate()` / `cp_onDateChange()` / `cp_applyDate()` | 1081-1095 | 날짜 선택기 초기화 + 변경 처리 |
| `cp_seasonHint(m)` | 1097 | 월별 시즌 키워드 매핑 (Gemini 프롬프트 보강용) |
| `cp_fmt()` / `cp_actHtml()` / `cp_trendHtml()` | 1101-1116 | 숫자 포맷 + 액션 배지 + 트렌드 화살표 HTML |
| `cp_findNaverMatch(name)` | 1118 | 정확/소문자/공백제거 매칭으로 브랜드명 fuzzy 검색 |
| `cp_fetchNaverDataForBrands(brandNames)` | 1130 | 브랜드명을 5개씩 묶어 네이버 API 배치 호출 |
| **`cp_analyze()`** | 1182 | **메인 흐름**: ① Gemini 호출 → ② 결과 카드/탭 채우기 → ③ 브랜드 30개로 네이버 합산 조회 → ④ 통합 테이블 렌더 |
| `cp_renderCombinedTable()` | 1257 | 통합 테이블 (쿠팡 AI + 네이버 실 데이터) |
| `cp_renderBrandTable()` | 1295 | 브랜드 TOP 20 (검색량 막대그래프) |
| `cp_renderCatGrid()` | 1313 | 카테고리 카드 그리드 |
| `cp_filterBrand()` / `cp_filterCombined()` | 1334-1342 | 카테고리별 행 숨기기 |
| `cp_switchTab(tab)` | 1344 | 통합/브랜드/카테고리 서브탭 전환 |
| `cp_exportCSV()` | 1353 | UTF-8 BOM CSV 내보내기 (한글 Excel 호환) |

### 📊 트렌드 분석 (`dl_` · 1373-1614줄)

| 함수 | 줄 | 역할 |
|------|----|----|
| `dl_initMonth()` / `dl_onMonthChange()` / `dl_applyMonth()` | 1384-1397 | 월 선택기 초기화 + 변경 처리 |
| **`dl_analyze()`** | 1399 | **메인 흐름**: ① `/api/analyze` 호출 (서버측 Gemini) → ② 카테고리/브랜드 카드 렌더 → ③ 네이버 키 있으면 검색광고 합산 |
| `dl_fetchAndMergeSearchAd()` | 1444 | 클라이언트측 `callNaverKeywordAPI`로 5개씩 배치 조회 + 합산표 렌더 |
| `dl_renderMergedTable()` | 1496 | 트렌드 점수 + 검색광고 데이터 합산 테이블 |
| `dl_exportCSV()` | 1524 | 합산표 CSV 내보내기 |
| `dl_renderCategoryList()` / `dl_renderBrandList()` | 1537-1571 | 카테고리/브랜드 리스트 (막대 + % 표시) |
| `dl_filterBrands(cat)` | 1573 | 카테고리 필터 탭 |
| **`dl_drillDown(category)`** | 1581 | **카테고리 클릭 시** `/api/drill` 호출 → 해당 카테고리 인기 브랜드 TOP 10 표시 |
| `dl_closeDrill()` | 1613 | 드릴다운 패널 닫기 |

### 🏬 백화점 검색 (`lt_` · 1617-1924줄)

| 함수 | 줄 | 역할 |
|------|----|----|
| `LT_BRAND_POOL` (상수) | 1619 | 4개 카테고리 × 약 50개 브랜드 = **고정 브랜드 풀** |
| `LT_BRANDS` (상수) | 1625 | 백화점별 입점 브랜드 매핑 (현재는 모든 백화점이 동일 풀 사용 — phase 1) |
| `LT_VIEWS` (상수) | 1628 | 5종 뷰 정의 (현재 월 / 4년 누적 / 연도별 비교 / 월별 상세 / 급상승·급하락) |
| `lt_renderTabs()` | 1644 | 백화점/카테고리/뷰 칩 버튼 렌더 + 분석 버튼 라벨 갱신 |
| `lt_switchView()` | 1659 | 뷰별 카드 표시/숨김 토글, historical 뷰는 캐시 확인 후 렌더 |
| `lt_setStatus()` | 1688 | 상태바 메시지 + 색상 |
| `lt_mergeBrandMonthly()` | 1695 | **검색광고 절대값 × 데이터랩 월별 비율 = 48개월 절대치 추정** |
| **`lt_analyze()`** | 1720 | **메인 흐름**: ① 검색광고로 현재 월 절대값 조회 → ② historical이면 데이터랩으로 월별 추이 조회 → ③ 머지 후 캐시 → ④ 뷰 렌더 |
| `lt_renderResults()` | 1799 | 현재 월 TOP 50 테이블 (요약 카드 + 비중 막대그래프 + %) |
| `lt_histRowHTML()` | 1829 | 과거 데이터 공용 행 HTML 빌더 |
| `lt_renderCumulative()` | 1846 | 4년 누적 TOP 50 |
| `lt_renderCompare()` | 1851 | 연도별 4컬럼 비교 + 순위 변동 (▲/▼/NEW) |
| `lt_renderMonthly()` | 1873 | 연도/월 서브탭 + 해당 월 TOP 50 |
| `lt_renderMovers()` | 1888 | 2022 → 2025 급상승·급하락 TOP 15 |
| `lt_exportCSV()` | 1911 | 결과 CSV 내보내기 |

### 🔧 서버측 함수 (`api/`)

| 파일 | 메서드 | 입력 | 출력 |
|------|---------|------|------|
| `api/analyze.js` | POST | `{period, month, apiKey}` | Gemini 호출 → 카테고리/브랜드 트렌드 JSON |
| `api/drill.js` | POST | `{category, period, apiKey}` | Gemini 호출 → 해당 카테고리 브랜드 TOP 10 JSON |
| `api/proxy.js` | GET / POST | `?url=...&headers=...` | 임의 URL로 요청 프록시 (네이버 API의 CORS 우회) |

---

## 🛠️ 트러블슈팅

| 증상 | 원인 / 해결 |
|------|-------------|
| `❌ API 키가 필요합니다` | Gemini 키 미입력. `🔑 API 설정`에서 입력 후 `저장` |
| `❌ Gemini 오류: ...` | Gemini 키 오류 또는 무료 할당량 초과 |
| `❌ API 오류 (404): The page could not be found` | Vercel에 `api/proxy.js` 미배포 → Vercel 재배포 또는 프록시를 `corsproxy.io`로 변경 |
| `❌ DataLab API 오류 (404): Error: Not found` | 프록시가 GET만 지원하는 경우 발생 → `api/proxy.js`가 POST를 지원하도록 수정되어 있어야 함 (현재 코드는 OK) |
| `hintKeywords 파라미터가 유효하지 않습니다` | 브랜드명 구분자를 `\n` 대신 `,`로 사용 (현재 코드는 OK) |
| `❌ 모든 프록시 시도 실패` | 네이버 키가 잘못되었거나 IP 제한 → `searchad.naver.com`에서 키 재발급 |
| 백화점 탭에서 비중 막대가 안 보임 | `.vol-bar`의 background 색상 누락이 원인 (현재 코드는 OK) |
| 재조회해도 결과가 갱신 안 됨 | `#tab-lotte .card-wrap`의 default `display:none` 누락 (현재 코드는 OK) |

---

## 📝 후임자를 위한 메모

### 코드 수정 시 주의사항

1. **네임스페이스 일관성** — 새 기능 추가 시 반드시 해당 탭의 접두사(`cp_`/`dl_`/`lt_`) 적용. 공유 자원만 접두사 없음.
2. **localStorage 키** — 7개 키 모두 `lo_` 접두사:
   - `lo_geminiKey`, `lo_naverCustId`, `lo_naverApiKey`, `lo_naverSecret`
   - `lo_datalabClientId`, `lo_datalabSecret`, `lo_datalabQuota`
3. **CSS 충돌 방지** — 탭별 고유 스타일은 `#tab-coupang`, `#tab-datalab`, `#tab-lotte` 셀렉터로 스코프 제한 권장
4. **API 호출 한도** — Gemini는 분당 60회, 데이터랩은 일일 1,000회. 백화점 탭의 4년치 분석은 카테고리당 약 10회 소비

### 향후 개선 가능 영역

- 백화점별 입점 브랜드 풀이 현재는 동일 (`LT_BRANDS`의 phase 1 주석 참조) → 백화점별로 다르게 큐레이션 필요
- 데이터랩 응답 캐시는 현재 메모리에만 저장 (`lt_histCache`) → 새로고침 시 사라짐 → IndexedDB 활용 검토
- Gemini 응답이 가끔 가상 브랜드를 생성해 검색광고 매칭률이 낮음 → 실 브랜드 화이트리스트로 보정 검토

### 관련 원본 프로젝트

이 통합 앱은 다음 3개 앱을 합친 것입니다 (각각의 독립 버전도 보존됨):
- `coupang reporter augmented/`
- `datalab trend edited/`
- `lotte search digger/`

각각의 단독 사용을 원하면 해당 폴더의 `index.html`을 직접 사용 가능합니다.

---

## 📌 기술 스택

- **Frontend**: 순수 HTML / CSS / JavaScript (프레임워크 없음, Noto Sans KR 웹폰트)
- **Backend**: Vercel Serverless Functions (Node.js 18+)
- **AI**: Google Gemini 2.5 Flash (JSON 응답 모드)
- **External API**: 네이버 검색광고 API (HMAC-SHA256), 네이버 데이터랩 API
- **Storage**: 브라우저 localStorage (키는 서버에 저장 안 됨)

---

## 📜 라이선스

라스트원 브랜드유통 사내 프로젝트 — 외부 배포 시 별도 협의 필요
