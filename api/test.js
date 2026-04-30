module.exports = function handler(req, res) {
  res.status(200).json({ ok: true, message: 'API 라우팅 정상 작동', method: req.method });
};
