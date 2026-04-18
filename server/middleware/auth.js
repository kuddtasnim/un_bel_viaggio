const jwt = require('jsonwebtoken');

module.exports = function requireAuth(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Необходима авторизация' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    req.userName = payload.name;
    next();
  } catch {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Сессия истекла, войдите снова' });
  }
};
