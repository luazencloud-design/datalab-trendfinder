module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = req.body.apiKey || process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(400).json({ error: 'API 키가 필요합니다. 입력란에 Gemini API 키를 입력해주세요.' });
  }

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
    // Gemini 2.5 Flash 모델 사용 (빠르고 저렴하며 JSON 모드 완벽 지원)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json" // Gemini의 JSON 강제 반환 기능
        }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    // Gemini 응답 구조에서 텍스트 추출 (null-safety 추가)
    const candidate = data.candidates && data.candidates[0];
    if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      const reason = candidate?.finishReason || '알 수 없음';
      throw new Error(`Gemini 응답이 비어 있습니다 (사유: ${reason}). 다시 시도해주세요.`);
    }
    const text = candidate.content.parts[0].text;
    
    // 이미 완벽한 JSON 문자열이 반환되므로 바로 파싱
    res.json(JSON.parse(text));
  } catch (e) {
    console.error('분석 오류:', e.message);
    res.status(500).json({ error: '분석 중 오류가 발생했습니다: ' + e.message });
  }
}