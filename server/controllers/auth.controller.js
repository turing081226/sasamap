const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000
};

const toPublicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role
});

const issueSession = (res, user) => {
  const jwtToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );

  res.cookie('token', jwtToken, cookieOptions);
};

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

    issueSession(res, user);

    res.json({
      message: 'Login successful',
      user: toPublicUser(user)
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ message: 'Failed to load session', error: error.message });
  }
};

exports.devLogin = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }

  try {
    const email = 'local@sasa.hs.kr';
    let user = await User.findByEmail(email);
    if (!user) {
      const insertId = await User.create({ email, name: '로컬 사용자', role: 'ADMIN' });
      user = await User.findById(insertId);
    }

    issueSession(res, user);
    res.json({ message: 'Dev login successful', user: toPublicUser(user) });
  } catch (error) {
    console.error('Dev login error:', error);
    res.status(500).json({ message: 'Dev login failed', error: error.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.json({ message: 'Logout successful' });
};
