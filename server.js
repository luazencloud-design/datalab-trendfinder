require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY가 .env 파일에 설정되지 않았습니다.');
  process.exit(1);
}

// ── 미들웨어 ──────────────────────────────────────────
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API 요청 제한 (1분에 최대 10회) - 과도한 API 비용 방지
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }
});
app.use('/api/', limiter);

// ── 메인 분석 API ─────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  const { period, month } = req.body;

  if (!period || !month) {
    return res.status(400).json({ error: '기간 정보가 필요합니다.' });
  }

  const prompt = `한국 네이버 쇼핑 트렌드 전문가로서, ${period}(${month}월 시즌) 기준 네이버 쇼핑인사이트 데이터를 바탕으로 분석하세요.

브랜드는 반드시 다음 4개 카테고리에서만 선정하세요: 패션의류, 스포츠레저, 출산육아, 패션잡화
각 카테고리에서 고루 브랜드를 선정하되 해당 월의 시즌과 트렌드를 반영하세요.
category 필드값은 반드시 "패션의류", "스포츠레저", "출산육아", "패션잡화" 중 하나여야 합니다.

JSON만 반환 (마크다운 없이):
{"period":"${period}","summary":"한 줄 트렌드 요약","categories":[{"rank":1,"name":"카테고리","score":100,"trend":"상승"},{"rank":2,"name":"카테고리","score":87,"trend":"유지"},{"rank":3,"name":"카테고리","score":74,"trend":"상승"},{"rank":4,"name":"카테고리","score":63,"trend":"하락"},{"rank":5,"name":"카테고리","score":53,"trend":"유지"},{"rank":6,"name":"카테고리","score":45,"trend":"상승"},{"rank":7,"name":"카테고리","score":38,"trend":"유지"},{"rank":8,"name":"카테고리","score":31,"trend":"하락"}],"brands":[{"rank":1,"name":"브랜드","score":100,"category":"패션의류"},{"rank":2,"name":"브랜드","score":94,"category":"스포츠레저"},{"rank":3,"name":"브랜드","score":88,"category":"패션의류"},{"rank":4,"name":"브랜드","score":82,"category":"출산육아"},{"rank":5,"name":"브랜드","score":77,"category":"패션잡화"},{"rank":6,"name":"브랜드","score":72,"category":"패션의류"},{"rank":7,"name":"브랜드","score":67,"category":"스포츠레저"},{"rank":8,"name":"브랜드","score":63,"category":"패션잡화"},{"rank":9,"name":"브랜드","score":59,"category":"출산육아"},{"rank":10,"name":"브랜드","score":55,"category":"패션의류"},{"rank":11,"name":"브랜드","score":51,"category":"스포츠레저"},{"rank":12,"name":"브랜드","score":48,"category":"패션의류"},{"rank":13,"name":"브랜드","score":45,"category":"패션잡화"},{"rank":14,"name":"브랜드","score":42,"category":"출산육아"},{"rank":15,"name":"브랜드","score":39,"category":"패션의류"},{"rank":16,"name":"브랜드","score":37,"category":"스포츠레저"},{"rank":17,"name":"브랜드","score":35,"category":"패션의류"},{"rank":18,"name":"브랜드","score":33,"category":"패션잡화"},{"rank":19,"name":"브랜드","score":31,"category":"출산육아"},{"rank":20,"name":"브랜드","score":29,"category":"패션의류"},{"rank":21,"name":"브랜드","score":27,"category":"스포츠레저"},{"rank":22,"name":"브랜드","score":25,"category":"패션의류"},{"rank":23,"name":"브랜드","score":24,"category":"패션잡화"},{"rank":24,"name":"브랜드","score":22,"category":"출산육아"},{"rank":25,"name":"브랜드","score":21,"category":"패션의류"},{"rank":26,"name":"브랜드","score":19,"category":"스포츠레저"},{"rank":27,"name":"브랜드","score":18,"category":"패션의류"},{"rank":28,"name":"브랜드","score":17,"category":"패션잡화"},{"rank":29,"name":"브랜드","score":16,"category":"출산육아"},{"rank":30,"name":"브랜드","score":15,"category":"패션의류"}]}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1800,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    res.json(JSON.parse(jsonMatch[0]));
  } catch (e) {
    console.error('분석 오류:', e.message);
    res.status(500).json({ error: '분석 중 오류가 발생했습니다: ' + e.message });
  }
});

// ── 카테고리별 브랜드 드릴다운 API ───────────────────
app.post('/api/drill', async (req, res) => {
  const { category, period } = req.body;

  if (!category || !period) {
    return res.status(400).json({ error: '카테고리와 기간 정보가 필요합니다.' });
  }

  const prompt = `${period} 기준 한국 네이버 쇼핑에서 "${category}" 카테고리의 인기 브랜드 TOP 10을 분석하세요.

JSON만 반환 (마크다운 없이):
{"brands":[{"rank":1,"name":"브랜드명","score":100,"desc":"한줄설명"},{"rank":2,"name":"브랜드명","score":88,"desc":"한줄설명"},{"rank":3,"name":"브랜드명","score":76,"desc":"한줄설명"},{"rank":4,"name":"브랜드명","score":65,"desc":"한줄설명"},{"rank":5,"name":"브랜드명","score":56,"desc":"한줄설명"},{"rank":6,"name":"브랜드명","score":48,"desc":"한줄설명"},{"rank":7,"name":"브랜드명","score":41,"desc":"한줄설명"},{"rank":8,"name":"브랜드명","score":35,"desc":"한줄설명"},{"rank":9,"name":"브랜드명","score":29,"desc":"한줄설명"},{"rank":10,"name":"브랜드명","score":24,"desc":"한줄설명"}]}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 700,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 파싱 실패');

    res.json(JSON.parse(jsonMatch[0]));
  } catch (e) {
    console.error('드릴다운 오류:', e.message);
    res.status(500).json({ error: '브랜드 분석 중 오류가 발생했습니다.' });
  }
});

// ── 서버 시작 ─────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
  console.log(`🔑 API 키: ${API_KEY.slice(0, 10)}...`);
});
