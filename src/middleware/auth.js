const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization');
    
    if (!token) {
      return res.status(401).json({ message: '인증 토큰이 없습니다.' });
    }

    // Extract token whether it has Bearer prefix or not
    const tokenParts = token.split(' ');
    const actualToken = tokenParts.length === 2 && tokenParts[0].toLowerCase() === 'bearer' 
      ? tokenParts[1] 
      : token;

    try {
      // Verify token
      const decoded = jwt.verify(actualToken, process.env.JWT_SECRET || 'your-secret-key');

      // Add user info to request
      req.user = {
        userId: decoded.userId
      };
      
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
};

module.exports = auth; 