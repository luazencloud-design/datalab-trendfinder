module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = req.body.apiKey || process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(400).json({ error: 'API 키가 필요합니다. 입력란에 Gemini API 키를 입력해주세요.' });
  }

  const { category, period } = req.body;
  if (!category || !period) {
    return res.status(400).json({ error: '카테고리와 기간 정보가 필요합니다.' });
  }

  const prompt = `${period} 기준 한국 네이버 쇼핑에서 "${category}" 카테고리의 인기 브랜드 TOP 10을 분석하세요.

JSON만 반환 (마크다운 없이):
{"brands":[{"rank":1,"name":"브랜드명","score":100,"desc":"한줄설명"},{"rank":2,"name":"브랜드명","score":88,"desc":"한줄설명"},{"rank":3,"name":"브랜드명","score":76,"desc":"한줄설명"},{"rank":4,"name":"브랜드명","score":65,"desc":"한줄설명"},{"rank":5,"name":"브랜드명","score":56,"desc":"한줄설명"},{"rank":6,"name":"브랜드명","score":48,"desc":"한줄설명"},{"rank":7,"name":"브랜드명","score":41,"desc":"한줄설명"},{"rank":8,"name":"브랜드명","score":35,"desc":"한줄설명"},{"rank":9,"name":"브랜드명","score":29,"desc":"한줄설명"},{"rank":10,"name":"브랜드명","score":24,"desc":"한줄설명"}]}`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const candidate = data.candidates && data.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      const reason = candidate?.finishReason || '알 수 없음';
      throw new Error(`Gemini 응답이 비어 있습니다 (사유: ${reason}). 다시 시도해주세요.`);
    }
    const text = candidate.content.parts[0].text;
    res.json(JSON.parse(text));
  } catch (e) {
    console.error('드릴다운 오류:', e.message);
    res.status(500).json({ error: '브랜드 분석 중 오류가 발생했습니다.' });
  }
}