const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { brands, customerId, apiKey, secretKey } = req.body;
  if (!customerId || !apiKey || !secretKey) {
    return res.status(400).json({ error: '네이버 검색광고 API 인증 정보가 필요합니다.' });
  }
  if (!brands || !brands.length) {
    return res.status(400).json({ error: '브랜드 목록이 필요합니다.' });
  }

  try {
    // 네이버 검색광고 API는 hintKeywords를 한 번에 5개까지 처리
    const batchSize = 5;
    const allKeywordData = [];

    for (let i = 0; i < brands.length; i += batchSize) {
      const batch = brands.slice(i, i + batchSize);
      const hintKeywords = batch.join(',');

      const timestamp = Date.now().toString();
      const method = 'GET';
      const path = '/keywordstool';
      const hmac = crypto.createHmac('sha256', secretKey);
      hmac.update(timestamp + '.' + method + '.' + path);
      const signature = hmac.digest('base64');

      const params = new URLSearchParams({
        hintKeywords: hintKeywords,
        showDetail: '1'
      });

      const response = await fetch(
        `https://api.searchad.naver.com${path}?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Timestamp': timestamp,
            'X-API-KEY': apiKey,
            'X-Customer': customerId,
            'X-Signature': signature
          }
        }
      );

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`네이버 API 오류 (${response.status}): ${errBody.substring(0, 200)}`);
      }

      const data = await response.json();
      if (data.keywordList) {
        allKeywordData.push(...data.keywordList);
      }

      // 과도한 호출 방지: 배치 사이 200ms 대기
      if (i + batchSize < brands.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    // 브랜드명과 정확히 일치하는 키워드만 매핑
    const keywordMap = {};
    for (const item of allKeywordData) {
      const kw = item.relKeyword;
      // 정확히 일치하는 브랜드를 먼저 찾고, 없으면 포함 관계로 매칭
      const exactMatch = brands.find(b => b.toLowerCase() === kw.toLowerCase());
      const partialMatch = !exactMatch
        ? brands.find(b => kw.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(kw.toLowerCase()))
        : null;
      const matchedBrand = exactMatch || partialMatch;

      if (matchedBrand && !keywordMap[matchedBrand]) {
        const parseCnt = (v) => {
          if (typeof v === 'number') return v;
          if (typeof v === 'string' && v.includes('<')) return 5; // "< 10" → 5로 추정
          return parseInt(v) || 0;
        };

        keywordMap[matchedBrand] = {
          matchedKeyword: kw,
          monthlyPcQcCnt: item.monthlyPcQcCnt,
          monthlyMobileQcCnt: item.monthlyMobileQcCnt,
          pcSearchNum: parseCnt(item.monthlyPcQcCnt),
          mobileSearchNum: parseCnt(item.monthlyMobileQcCnt),
          totalSearch: parseCnt(item.monthlyPcQcCnt) + parseCnt(item.monthlyMobileQcCnt),
          monthlyAvePcClkCnt: item.monthlyAvePcClkCnt || 0,
          monthlyAveMobileClkCnt: item.monthlyAveMobileClkCnt || 0,
          compIdx: item.compIdx || '-',
          monthlyAvePcCpc: item.monthlyAvePcCpc || 0,
          monthlyAveMobileCpc: item.monthlyAveMobileCpc || 0,
          avgCpc: Math.round(((item.monthlyAvePcCpc || 0) + (item.monthlyAveMobileCpc || 0)) / 2)
        };
      }
    }

    // 브랜드별 결과 조합
    const results = brands.map(brand => {
      const data = keywordMap[brand];
      if (!data) {
        return {
          brand,
          found: false,
          matchedKeyword: '-',
          pcSearch: '-',
          mobileSearch: '-',
          totalSearch: 0,
          pcClicks: 0,
          mobileClicks: 0,
          compIdx: '-',
          pcCpc: 0,
          mobileCpc: 0,
          avgCpc: 0
        };
      }
      return {
        brand,
        found: true,
        matchedKeyword: data.matchedKeyword,
        pcSearch: data.monthlyPcQcCnt,
        mobileSearch: data.monthlyMobileQcCnt,
        totalSearch: data.totalSearch,
        pcClicks: data.monthlyAvePcClkCnt,
        mobileClicks: data.monthlyAveMobileClkCnt,
        compIdx: data.compIdx,
        pcCpc: data.monthlyAvePcCpc,
        mobileCpc: data.monthlyAveMobileCpc,
        avgCpc: data.avgCpc
      };
    });

    res.json({ results });
  } catch (e) {
    console.error('검색광고 API 오류:', e.message);
    res.status(500).json({ error: e.message });
  }
};
