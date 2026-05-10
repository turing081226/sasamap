const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    if (!email.endsWith('@sasa.hs.kr')) {
      return res.status(403).json({ message: 'Only @sasa.hs.kr domain is permitted to login.' });
    }

    let user = await User.findByEmail(email);
    if (!user) {
      const insertId = await User.create({ email, name, role: 'USER' });
      user = await User.findById(insertId);
    }

    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token: jwtToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
};

// ─── Mock Login (개발용: 구글 없이 이메일만으로 로그인) ───────────
exports.mockLogin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!email.endsWith('@sasa.hs.kr')) {
      return res.status(403).json({ message: '학교 계정(@sasa.hs.kr)만 로그인할 수 있습니다.' });
    }

    // DB에서 유저 찾기 or 생성
    let user = await User.findByEmail(email);
    if (!user) {
      const name = email.split('@')[0]; // 이메일 앞부분을 이름으로
      const insertId = await User.create({ email, name, role: 'USER' });
      user = await User.findById(insertId);
    }

    // 진짜 JWT 발급
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Mock login successful',
      token: jwtToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });

  } catch (error) {
    console.error('Mock login error:', error);
    res.status(500).json({ message: 'Mock login failed', error: error.message });
  }
};

